// Headless Chrome screenshot + layout audit over the DevTools protocol.
// No dependencies (uses Node's built-in fetch/WebSocket, Node >= 22).
//
//   node scripts/visual-check.mjs path/to/config.json
//
// Config shape:
// {
//   "out": "tmp/shots",                        // output folder
//   "viewport": { "width": 390, "height": 844, "mobile": true },
//   "reducedMotion": false,                    // optional
//   "pages": [{ "name": "home", "url": "http://localhost:3000/",
//     "intro": false,                          // true = let the preloader play
//     "shots": [{ "name": "services", "selector": "#services", "offset": 0 }] }]
// }
//
// Prints, per page, the document width vs viewport and any elements that
// overflow horizontally (outside a clipping ancestor), then any console
// errors/warnings and uncaught exceptions. Chrome is found via CHROME_PATH
// or the usual install locations.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].find((p) => p && existsSync(p));
if (!CHROME) {
  console.error("No Chrome/Chromium found — set CHROME_PATH.");
  process.exit(1);
}

const cfg = JSON.parse(readFileSync(process.argv[2], "utf8"));
const OUT = cfg.out;
mkdirSync(OUT, { recursive: true });
const PORT = cfg.port ?? 9333;
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${join(tmpdir(), `naxis-visual-check-${Date.now()}`)}`,
    "--hide-scrollbars",
    "--no-first-run",
    "--autoplay-policy=no-user-gesture-required",
    "about:blank",
  ],
  { stdio: "ignore" }
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) {
  await sleep(200);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    wsUrl = list.find((t) => t.type === "page")?.webSocketDebuggerUrl;
  } catch {}
}
const ws = new WebSocket(wsUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const logs = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else if (msg.method === "Runtime.exceptionThrown") {
    logs.push("EXCEPTION " + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text).slice(0, 300));
  } else if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) {
    logs.push(msg.params.type.toUpperCase() + " " + msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 300));
  }
};
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
const evaluate = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  return r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description;
};

await send("Runtime.enable");
await send("Page.enable");
const { width, height, mobile } = cfg.viewport;
await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: !!mobile });
if (mobile) {
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Emulation.setUserAgentOverride", {
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36",
  });
}
if (cfg.reducedMotion) {
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
}

for (const page of cfg.pages) {
  await send("Page.navigate", { url: page.url });
  await sleep(1500);
  if (!page.intro) await evaluate("sessionStorage.setItem('naxis:intro-seen','done')");
  await send("Page.reload", { ignoreCache: true });
  await sleep(page.settle ?? 4500);

  const audit = await evaluate(`(() => {
    const vw = document.documentElement.clientWidth;
    const over = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > vw + 1 || r.left < -1) {
        let p = el, clipped = false;
        while ((p = p.parentElement)) { const o = getComputedStyle(p).overflowX; if (o === 'hidden' || o === 'clip' || o === 'auto' || o === 'scroll') { clipped = true; break; } }
        if (!clipped) over.push(el.tagName + '.' + String(el.className).slice(0, 50) + ' [' + Math.round(r.left) + ',' + Math.round(r.right) + ']');
      }
    }
    return { docW: document.documentElement.scrollWidth, vw, docH: document.documentElement.scrollHeight, overflowing: over.slice(0, 12) };
  })()`);
  console.log(page.name, JSON.stringify(audit));

  for (const shot of page.shots) {
    const y = await evaluate(`(() => {
      ${shot.selector ? `const el = document.querySelector(${JSON.stringify(shot.selector)}); if (!el) return 'missing'; const base = el.getBoundingClientRect().top + window.scrollY;` : "const base = 0;"}
      const y = base + ${shot.offset ?? 0};
      window.scrollTo(0, y);
      return Math.round(y);
    })()`);
    await sleep(shot.wait ?? 1800);
    // Second jump settles ScrollTrigger scrub lag.
    await evaluate(`window.scrollTo(0, ${typeof y === "number" ? y : 0}); 1`);
    await sleep(700);
    const shotRes = await send("Page.captureScreenshot", { format: "jpeg", quality: 70 });
    writeFileSync(`${OUT}/${page.name}-${shot.name}.jpg`, Buffer.from(shotRes.result.data, "base64"));
    console.log("  shot", shot.name, "y=", y);
  }
}
console.log("LOGS:\n" + (logs.length ? [...new Set(logs)].join("\n") : "(none)"));
ws.close();
chrome.kill();
process.exit(0);
