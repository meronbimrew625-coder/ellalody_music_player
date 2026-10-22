# Data and API Notes

## Music data
- `/api/music` calls the public Apple/iTunes Search API from a Next.js route handler.
- `/api/music/jamendo` supports Jamendo when `JAMENDO_CLIENT_ID` is configured in `.env.local`.
- Music results and preview availability depend on the providers. iTunes preview URLs are short previews, not full-length tracks.

## Browser data
- Favorites, playlists, listening statistics, demo account data, and vault records are stored in the current browser (local storage or IndexedDB as applicable).
- Browser-stored data is not synchronized across devices and is not a substitute for database persistence or server-side authorization.

## Future data work
- Add a database only if persistent user accounts and cross-device synchronization are required.
- If adding authenticated data access, verify the user on the server and scope every query to that user's ID.
- Add appropriate caching/revalidation for public music metadata, while avoiding caching private user-specific data across users.
