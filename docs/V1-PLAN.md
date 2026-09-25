# NAXIS website — V1 plan

The full scope of V1: the homepage (done) plus the inner pages below,
built from the client pack in `client-details/`. Approved by the owner on
2026-09-25. Work happens on `v1-homepage-rebuild`; `main` is only updated
when the owner asks.

The rule for content is the one in `PROJECT-NOTES.md`: client copy
verbatim where it exists, `[CONFIRM WITH CLIENT]` for any unconfirmed
fact, nothing invented.

## Sitemap

| Page | Route | Built from | Status |
| --- | --- | --- | --- |
| Home | `/` | Everything | Built; sections link out to the pages |
| About | `/about` | About artboard, profile p1 | Built |
| Services hub | `/services` | Profile pp2-5 | Built |
| Service pages x4 | `/services/[slug]` | Profile pp2-5 | Built, one signature each |
| Start a Project | `/contact` | MOQ artboard | Built; contact details and enquiry delivery pending |
| Compliance | `/compliance` | Profile p6 | Built; official logos pending |
| How We Work | `/how-we-work` | Profile p1 process, MOQ artboard | Built (photo version); owner's Runable clips pending |
| Global Network | later | Homepage map | Blocked on per-country roles |
| What We Make | not built | nothing | Categories aren't in any client material |
| 404 | `not-found` | | Built |
| Privacy notice | later | client / their adviser | Needed once the form collects details |

Pages chain through their closing "next chapter": About → Services →
How We Work → Compliance → Start a Project; each service page leads to
the next service.

## Foundations (shared by every page)

1. **Real pages in the menu.** Full-screen menu, large Bebas items, image
   preview on hover, current-page marker. Homepage sections link out.
2. **Page transitions.** React `<ViewTransition>` (built into Next 16, no
   config): a branded wipe between pages, and shared-element morphs where
   the image you clicked becomes the next page's hero. Instant under
   reduced motion or without browser support.
3. **The thread.** The dashed gold arrow from the client's own process
   diagram, drawn on scroll as the connector between sections and pages.
4. **Shared motion kit** lifted from the homepage: frame-to-card hero exit,
   line reveals (GSAP SplitText), scrubbed word fill, curtain images,
   swipe deck, tick rail.
5. **SEO for lead generation.** Per-page metadata, generated Open Graph
   images, sitemap, robots, Organization structured data.

## Page concepts

- **About, "From Concept to Creation. Factory to You."** The tagline's four
  words as pinned chapters (the word rolls over in place while its
  paragraph and photo reveal). "Experience, innovation, integrity and
  strong partnerships" as four words that fill gold to emerald. Artboard
  typography (serif on ivory, gold rules); sign-off lockup.
- **Services hub, "Four chapters, one journey."** Giant typographic index;
  hover reveals the photo in a cursor-following mask and clicking morphs it
  into the service hero. Phones: the row crossing mid-screen lights up.
- **Service pages.** Shared template (hero exit, line reveals, thread-drawn
  stage timeline, word-filled pull quote, next-chapter footer) plus one
  signature each: *Sketch to sample* (Product Development), *The line*
  (Manufacturing), *The loupe* (Quality), *Factory to your door*
  (Logistics).
- **Start a Project.** The MOQ copy's own three questions ("what you want to
  create, how many you need, and where you want to go with your idea") as
  a conversational form, read back as a sentence before sending.
  Enquiries go through a route handler to an email service once it's
  configured, and fall back to a prefilled email until then.
- **Compliance.** Each certification as a swing tag (the client's imagery
  uses them) that sways with scroll speed and flips to show its full name
  and scope. Typographic until official logos arrive.
- **How We Work, "Thread to doorstep."** The eight stages from the client's
  diagram as chapters; photo version first, the scroll-scrubbed film when
  the clips arrive.
- **404, "Lost in transit."** A marker circling the route map.

## Build order

1. Foundations
2. Start a Project
3. About
4. Services hub + service pages
5. Compliance
6. How We Work + 404
7. Global Network, once the client sends per-country details

Each page: eslint + build clean, checked at phone / tablet / desktop and
reduced motion, its own commits, pushed to `v1-homepage-rebuild`.

Steps 1–6 were built on 2026-09-25. Step 7 waits on the client.

## Waiting on the client

- Contact email / phone / WhatsApp, Australian address
- Enquiry delivery: a verified sending domain + API key (Resend) set as
  `RESEND_API_KEY` / `ENQUIRY_TO` / `ENQUIRY_FROM` in Vercel
- Official certification logos, and which facility holds which
- Whether to use "Responsible sourcing. Stronger tomorrow." (from the tag
  in the profile's page 6 photo) on the Compliance page
- Years / figures behind "decades of experience"
- Per-country roles for the Global Network page
- Product categories (What We Make)
- Privacy notice wording
