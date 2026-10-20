# Shahrokh's office

Portfolio of **Adib Rezazadeh** (Shahrokh), senior full-stack engineer and technical leader. The site is a low-poly office you can walk up to: the monitor opens **ShahrokhOS**, the frames are the work, the bookshelf is the stack, and the desk phone is contact.

Languages: [English](/en), [فارسی](/fa), and [العربية](/ar). Persian and Arabic use RTL. A language picker is the front door.

On a phone, a narrow window, or a machine that prefers reduced motion, the site opens in **simple mode**: the same facts, without WebGL. The button in the corner switches either way.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

## What is in the room

- **Monitor** — ShahrokhOS: project folders, a resume you can read or download, and a terminal (`help`, `whoami`, `projects`, `contact`, plus `skills`, `education`, `open`, `resume`, `clear`).
- **Frames** — roles and selected work, with the public links that exist.
- **Bookshelf** — the stack and leadership list from the resume.
- **Phone** — email, phone, LinkedIn, GitHub.
- **Desk assistant** — answers in the language you picked, from local notes. It does not call a paid API unless you opt in.

Facts come from Adib's resume. Stogite, Hubly, Glonova, and Meraas Gallery also use those projects' public pages. Nothing else is filled in.

The room uses CC0 textures and the `studio_small_09` HDRI from [Poly Haven](https://polyhaven.com), compressed for the web. See `public/textures/CREDITS.txt`.

## Optional assistant API

Leave these unset and the assistant stays on local notes. If both are set, only questions the notes do not match are sent to an OpenAI-compatible chat endpoint. The key stays on the server.

```bash
ASSISTANT_API_KEY=
ASSISTANT_API_URL=https://api.openai.com/v1/chat/completions
ASSISTANT_MODEL=gpt-4o-mini
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

## Deploy

The app is a Next.js App Router project and deploys on Vercel with no extra services. `npm run build` is the production build.
