# Performance and Accessibility Checklist

Before submission, test these items in the target browser and document actual results:

- [ ] Run `npm run build` and resolve build errors.
- [ ] Test home, explore, search, favorites, playlists, menu, moods, mood-mix, stats, quiz, signin, signup, and vault routes.
- [ ] Test loading, empty, and API error states with network access unavailable or provider failures.
- [ ] Navigate using Tab, Shift+Tab, Enter, and Space; verify visible focus and sensible focus order.
- [ ] Check accessible labels for inputs and controls, meaningful image alt text, heading order, and sufficient contrast.
- [ ] Test the layout on a narrow mobile viewport and a desktop viewport.
- [ ] Use Lighthouse or browser performance tools and record the real results; do not report scores that were not measured.

Potential follow-up improvements include optimized images, reducing unnecessary client-side JavaScript, and caching public catalog responses where appropriate.
