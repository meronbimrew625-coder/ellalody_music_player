# Project Structure

```text
ellalody-nextjs/
├── app/
│   ├── api/music/route.js
│   ├── api/music/jamendo/route.js
│   ├── explore/page.js
│   ├── favorites/page.js
│   ├── menu/page.js
│   ├── mood-mix/page.js
│   ├── moods/page.js
│   ├── playlists/page.js
│   ├── quiz/page.js
│   ├── search/page.js
│   ├── signin/page.js
│   ├── signup/page.js
│   ├── stats/page.js
│   ├── vault/page.js
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── components/
│   ├── AppShell.jsx
│   ├── AuthForm.jsx
│   ├── CollectionView.jsx
│   ├── ExploreView.jsx
│   ├── HomeView.jsx
│   └── TrackCard.jsx
├── public/
├── AUTH.md
├── DATA.md
├── FUTURE.md
├── PERF.md
├── README.md
└── package.json
```

`app/` defines routes and API route handlers. `components/` contains reusable React UI components. `.jsx` is used for reusable components; `.js` remains appropriate for Next.js route files and API handlers. The app uses regular CSS, not Tailwind.
