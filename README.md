# siwat.me

Personal portfolio site — **[siwat.me](https://siwat.me)**

Full-stack developer in training with Generation Thailand (JSD13), working
across both development and design: the craft of the front end, and the API,
data and deployment work behind it.

---

## About the site

A hand-written static site — no framework, no bundler, no `package.json`. Three
files do the work: `index.html`, `style.css`, `script.js`. Everything else is
images and one Cloudflare Worker.

It is built that way on purpose. The design leans on a small set of CSS custom
properties and a 12-column grid rather than a component library, and the
interactions are short vanilla-JS IIFEs rather than a runtime.

**Design direction:** Swiss / editorial — warm off-white paper, near-black ink,
a single cobalt accent reserved for interaction and position, and a serif
italic used on exactly one word per heading.

| | |
|---|---|
| Markup & styling | HTML5, CSS3 (custom properties, Grid, `clamp()`, `color-mix()`) |
| Behaviour | ES6, no dependencies — IntersectionObserver, `document.fonts.ready`, Canvas `TextMetrics` |
| Type | Archivo · Instrument Serif · Inter · JetBrains Mono (Google Fonts) |
| Hosting | Cloudflare Pages, auto-deployed from this repo |
| APIs | Cloudflare Workers |

Accessibility: all text meets WCAG AA contrast, motion respects
`prefers-reduced-motion`, and every progressive enhancement degrades to
readable content if its script or asset fails.

---

## Running it locally

No install step — it is static files.

```bash
python3 -m http.server 8642
```

Then open <http://localhost:8642>.

The GitHub calendar will be empty on `localhost` unless the origin is allowed
in the Worker's `ALLOWED_ORIGINS`; the section removes itself when the API is
unreachable, so nothing breaks.

---

## Layout

```
index.html                    markup — nav, hero, and six sections
style.css                     tokens → typography → layout → motion → components
script.js                     scroll, typing, line reveals, disclosures, API calls
images/                       portrait photograph and line illustration
project-images/               project screenshots
work/                         case studies — Context → Constraints → Decisions →
                               What broke → Result → What I'd do differently
workers/
  github-contributions/       Cloudflare Worker — see its own README
```

### The Worker

[`workers/github-contributions`](workers/github-contributions) proxies the
GitHub GraphQL contributions calendar so the personal access token stays
server-side. It caches at the edge for an hour and is locked to this origin by
CORS. Deploy notes and the response shape are in its README.

The visitor counter calls a second Worker (Workers + D1) that lives outside
this repo.

---

## Projects featured

| | Project | Built with |
|---|---|---|
| 01 | [AWS S3 Static Website](https://github.com/sjsiwat/aws-static-website) | S3, CloudFront, ACM, AWS CLI |
| 02 | [AWS EC2 Nginx Website](https://github.com/sjsiwat/AWS-EC2-nginx-website) | EC2, Ubuntu, Nginx, SSH |
| 03 | [Johny Memo](https://github.com/sjsiwat/Little-Johny) — [live](https://johny.siwat.me) · [case study](work/johny-memo.html) | Supabase, PostgreSQL RLS, magic-link auth, PWA |
| 04 | [MDflow](https://github.com/sjsiwat/MDflow) — [case study](work/mdflow.html) | n8n, Docker, Gemini, Google Drive API v3 |

---

## Contact

Chiang Mai, Thailand — open to junior full-stack / frontend roles & internships.

- [sj.siwat@gmail.com](mailto:sj.siwat@gmail.com)
- [github.com/sjsiwat](https://github.com/sjsiwat)
- [linkedin.com/in/siwat-jankam-9a340016a](https://www.linkedin.com/in/siwat-jankam-9a340016a)
