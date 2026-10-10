# Oya, Prove It

A private, casual two-player game night for Shazily and Anike. Both people join the same room and tap “I’m ready”. The game starts with **Who said it?**: choose a name, wait for your partner’s guess, and see the answer together. There are eight quick rounds with scores and a winner or tie at the end.

The game menu also offers guessing replies, asking each other a memory question, sharing a short memory, and saying something sweet. The chat recap is optional: fifteen short cards with simple jokes and real chat quotes. Cards move only when you tap Next; there is no timer or required presentation. Chat counts sit behind “Where this came from”.

Each phone shows its own answer controls. Answers stay hidden until both people submit; memory-question answers stay hidden until the partner guesses. Live chat includes incoming-message previews and unread badges. One-phone play is also available. No images or raw chat exports are included.

## Firebase setup

The web configuration is already included in `src/firebase-room.js`. Anonymous Authentication must be enabled. Copy all of `firestore.rules` into the Firestore Rules tab and publish. No service-account credentials or paid services are required.

Create a room as your own character and send its invitation link to your partner. Keep the invitation between the two of you. Use the same browser when returning, since anonymous identity belongs to that browser.

## Build and deployment

Run `npm ci` and `npm run build`. Serve `dist` using any static web server. For Vercel, import the private repository with Framework Preset Other, Build Command `npm run build`, and Output Directory `dist`. Deployment has not been performed.

The browser Firebase API key is public configuration. The original Firebase console key was checked successfully; a later copied key had transposed characters and was invalid.

## Verification

`npm run test:rules` runs eight Firestore emulator security tests. It requires Java and the Firebase emulator download. The browser test uses Playwright with Chromium, a static server on port 8001 serving the project root, and Authentication and Firestore emulators on ports 9099 and 8080. Run `node test/two-player.cjs` while those servers are running. Set PLAYWRIGHT_MODULE and CHROMIUM_PATH if they are installed outside normal paths.

The optional count notes explain the numbers. Jokes and votes are just for fun. Selected excerpts are intentionally included in the app, so the repository should remain private.
