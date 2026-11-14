# AMI by KasaTECH — The Focus Buddy

> **"A small friend for big days. One thing at a time."**

A calm, physical-first desk companion and local-first focus timer inspired by minimalist industrial design and friendly helper robots (smooth white ovoid body, glossy black visor, twin luminous capsule eyes, and breathing rose heart ring).

---

## Features

- **Editorial Web Showcase:** An authentic, anti-slop marketing presentation respecting the KasaTECH design system.
- **3-Surface App UI (§5.2):**
  - **Focus:** 96 px tabular monospace timer, Study / Work / Reset modes, 56 px rose pillar button, mood selector, and synthesized Web Audio chime.
  - **Nudges:** Paced break reminders (eye pause, posture reset, hydration) with inline creation.
  - **You:** Local-first stats (sessions, minutes, streaks) and 7-day visual consistency strip.
- **Interactive Robot Mascot:** Real-time SVG companion that blinks, tracks cursor movement, and breathes gently during focus blocks.
- **Design System:** Zero gradients, pure paper canvas (`#FFF7F4`), cream cards (`#FFFDF9`), dusty rose (`#D88E9A`), and charcoal ink (`#3E3334`).

---

## Quick Start (Run Locally)

```bash
cd app
npx serve .
```
Or open `index.html` directly in any web browser.

---

## Deploy to Vercel

You can deploy directly to Vercel in seconds using Vercel CLI:

```bash
cd app
npx vercel
```
*Follow the interactive prompts to log into your Vercel account and deploy with zero configuration.*

For a production deployment:
```bash
npx vercel --prod
```

---

## Push to your GitHub Repository

1. Create a new repository on [GitHub](https://github.com/new) named `ami-kasatech`.
2. Run these commands from your local terminal:
```bash
cd /home/lucia/Documents/AMI-KasaTECH/app
git remote add origin https://github.com/<YOUR_USERNAME>/ami-kasatech.git
git branch -M main
git push -u origin main
```
3. In your Vercel Dashboard, you can also link the GitHub repo for automated continuous deployment on every push!
