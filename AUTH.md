# Authentication and Security Notes

## Current implementation
- `/signin` and `/signup` are included and share the reusable `components/AuthForm.jsx` component. Visitors without a local demo session are redirected to the sign-in page before accessing the music pages. Sign out clears the demo session.
- This is a browser-only demonstration. Account data and derived password hashes are stored in the browser's local storage.
- This is not production authentication. Browser storage can be inspected or changed, accounts do not synchronize between browsers/devices, and there is no server-enforced authorization.
- Do not use real or reused passwords in this demo.

## Production improvements
- Use server-side authentication with secure, HTTP-only, SameSite cookies.
- Store accounts in a database and hash passwords on the server with a modern password-hashing library.
- Validate inputs on the server, rate-limit sign-in attempts, protect sensitive actions, and verify the current user on every protected server action/API request.
- Never treat client-side route hiding or local storage as access control.
