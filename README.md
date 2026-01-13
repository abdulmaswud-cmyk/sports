# Lane Switch Sports (Expo / React Native)

Lane-switching car game (3 lanes) with sports-knowledge collectibles powered by **TheSportsDB**.

## Features

- **Arcade gameplay**: swipe/tap to switch lanes, dodge obstacles, progressive difficulty.
- **Sports collectibles**: ⚽🏀⚾ spawn as items that grant a gameplay effect (shield / slow-mo / score boost) and show a quick fact.
- **Cross-platform**: iOS, Android, and Expo Web.
- **High score**: stored locally (AsyncStorage, works on web too).

## Tech

- Expo + React Native + TypeScript
- Routing: `expo-router`
- Game loop: `requestAnimationFrame`
- Sports API: TheSportsDB (`https://www.thesportsdb.com/api/v1/json/3`)

## Local development

Install deps:

```bash
npm install
```

Run:

```bash
npm run start
```

Or directly:

```bash
npm run android
npm run web
```

## Web build (static export)

```bash
npm run web:build
```

This produces a static site in `dist/`.

## Deploy to Vercel

This repo includes `vercel.json` configured for Expo static export.

- **Build command**: `npm run vercel-build`
- **Output directory**: `dist`

You can import the repo in Vercel and deploy as a static site.

## Notes

- Sports-data fetch runs on game start. If TheSportsDB is unavailable, the game falls back to a small built-in set of facts.

