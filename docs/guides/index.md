---
title: Getting started
---

# Getting started

A local viewer for reading markdown documentation, tuned for both desktop and mobile.

## Quick start

To drop this viewer into any project:

```bash
npx degit ilwonyoon/markdown-preview docs-viewer
cd docs-viewer
npm install
npm run dev
```

The dev server binds to `0.0.0.0`, so any device on the same Wi-Fi can reach it.

## Find your local IP

```bash
npm run ip
# or directly
ipconfig getifaddr en0
```

If it prints `192.168.1.42`, open `http://192.168.1.42:5180` on your phone.

::: tip Stable bookmarks
The port is pinned to `5180` (rather than the Vite default `5173`) so it does not collide with other dev servers, and your mobile bookmark stays valid across sessions.
:::

## Add documents

Put `.md` files anywhere under `docs/`. Register them in the `sidebar` section of `docs/.vitepress/config.ts` to make them appear in the left nav.

```
docs/
├── guides/
│   ├── index.md
│   └── markdown-syntax.md
└── notes/
    ├── index.md
    └── sample.md
```
