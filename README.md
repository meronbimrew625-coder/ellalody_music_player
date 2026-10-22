# Ellalody Music Player

## Requirements
- Node.js 20 or newer
- Internet connection for installing packages and searching online music catalogs

## Run on Windows
1. Extract this ZIP.
2. Open the extracted `ellalody-nextjs` folder in VS Code. It must be the folder that contains `package.json`, `app`, `components`, and `public`.
3. In VS Code, choose **Terminal → New Terminal**. Check the terminal path ends with `\ellalody-nextjs`.
4. Run these commands one at a time:

```bat
npm install
npm run dev
```

5. Open http://localhost:3000.

If `npm run dev` says `Missing script: dev`, you are not in the folder containing this project's `package.json`. Run `dir` and confirm that `package.json` is listed before running the commands.

## Custom logo
The app uses `public/cover.svg` for its brand logo and default artwork. The `public\cover.svg` file remains the default music artwork fallback.

## Features included
- Sign in and sign up demo pages
- Home, Explore, Search, Favorites, Playlists, Mood Mix, Listening Stats, and Song Quiz
- Search from the top bar (press Enter; Ctrl+K focuses it)
- Queue icon beside tracks and queue panel in the player
- Audio preview player, lyrics panel (availability depends on the lyrics service and song)
- Theme choices, account menu, and minimizable player
- Privacy Folder demo with encrypted browser-stored copies and in-page audio/video preview

## Important limitations
- Authentication is a browser demo, not production-grade server authentication.
- Music providers generally offer previews rather than unrestricted full songs.
- Lyrics are fetched from a third-party service; some songs will not have lyrics available.
- Privacy Folder stores encrypted copies in this browser. It does not hide or delete the original files from Windows or a phone gallery, and it does not sync across devices.
