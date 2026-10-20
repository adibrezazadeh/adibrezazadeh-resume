# Adib Rezazadeh — portfolio

Portfolio of **Adib Rezazadeh**, full-stack engineer and technical lead. Persian: ادیب رضازاده. Arabic: أديب رضازاده. The site is a lamp-lit office you can walk up to: the monitor opens **AdibOS**, the frames are the work, the bookshelf is the stack, and the desk phone is contact.

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

## How a visit goes

1. **Boot.** A BIOS-style screen types out the resume while the room loads, then asks for a click. The click also unlocks sound.
2. **Lights on.** The camera flies in from the dark along a curved path, the desk lamp clicks on with a flicker, and the monitor powers up into AdibOS.
3. **Digital-twin desk.** Keys on the 3D keyboard press down as the visitor types, and the 3D mouse slides and clicks with their real one. Every key, click, and whoosh is synthesized with the Web Audio API (`lib/sound.ts`), so there are no audio files.
4. **Your sky.** The window shows dawn, day, dusk, or night from the visitor's local clock, and the room light follows it.

## What is in the room

- **Monitor** — a thin-bezel display running AdibOS: project folders, a resume you can read or download, and a terminal (`help`, `whoami`, `projects`, `contact`, plus `skills`, `education`, `open`, `resume`, `clear`).
- **Phone on a stand** — email, phone, LinkedIn, GitHub.
- **Frames** — roles and selected work, with the public links that exist.
- **Bookshelf** — the stack and leadership list from the resume.
- **Desk assistant** — answers in the language you picked, from local notes. It does not call a paid API unless you opt in.

Facts come from Adib's resume. Stogite, Hubly, Glonova, and Meraas Gallery also use those projects' public pages. Nothing else is filled in.

The room uses CC0 photogrammetry models, textures, and the `studio_small_09` HDRI from [Poly Haven](https://polyhaven.com), compressed for the web. See `public/textures/CREDITS.txt`. The monitor, laptop, keyboard, mouse, LED lamp, and phone are modeled here; Poly Haven has no modern versions of those.

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
