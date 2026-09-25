import { enquiryEmailText, enquirySubject, parseEnquiry } from "@/lib/enquiry";

// Receives the Start a Project brief and emails it to NAXIS through Resend.
//
// Needs three environment variables in Vercel (none are set yet — see
// docs/V1-PLAN.md, "Waiting on the client"):
//   RESEND_API_KEY  API key for a Resend account
//   ENQUIRY_FROM    a sender on a domain verified in Resend,
//                   e.g. "NAXIS website <enquiries@their-domain>"
//   ENQUIRY_TO      where briefs go (comma-separate for several)
// Until they're set it answers 503 "not-configured", and the form offers to
// send the same brief from the visitor's own email app instead.

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const parsed = parseEnquiry(body);
  if (!parsed.ok) {
    return Response.json({ ok: false, error: "invalid", fields: parsed.errors }, { status: 400 });
  }
  const { enquiry } = parsed;

  // Honeypot filled in: look successful to the bot, send nothing.
  if (enquiry.website) return Response.json({ ok: true });

  const key = process.env.RESEND_API_KEY;
  const from = process.env.ENQUIRY_FROM;
  const to = process.env.ENQUIRY_TO;
  if (!key || !from || !to) {
    return Response.json({ ok: false, error: "not-configured" }, { status: 503 });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: to.split(",").map((address) => address.trim()).filter(Boolean),
        reply_to: enquiry.email,
        subject: enquirySubject(enquiry),
        text: enquiryEmailText(enquiry),
      }),
    });
    if (!res.ok) {
      return Response.json({ ok: false, error: "send-failed" }, { status: 502 });
    }
  } catch {
    return Response.json({ ok: false, error: "send-failed" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
