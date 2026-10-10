# Oya, Prove It

A private two-player game night for Shazily and Anike. The ten-minute opening hearing uses third-person narration, playful awards, selected WhatsApp excerpts, and clearly defined statistics. Partner questions use the question author's voice.

Six experiences include the opening hearing, quote guessing, author-written memory traps, finishing replies, shared memories, and a quiet closing chapter. Both players join by invitation and mark themselves ready. Presentation navigation, progress, objections, quizzes, and contextual chat synchronize through Firebase. Answers stay hidden until submission. No images or raw chat exports are included.

## Firebase setup

The web configuration is already included in `src/firebase-room.js`. Anonymous Authentication must be enabled. Copy all of `firestore.rules` into the Firestore Rules tab and publish. No service-account credentials or paid services are required.

Create a room as your own character and send its invitation link to your partner. Keep the invitation between the two of you. Use the same browser when returning, since anonymous identity belongs to that browser.

## Build and deployment

Run `npm ci` and `npm run build`. Serve `dist` using any static web server. For Vercel, import the private repository with Framework Preset Other, Build Command `npm run build`, and Output Directory `dist`. Deployment has not been performed.

The browser Firebase API key is public configuration. The original Firebase console key was checked successfully; a later copied key had transposed characters and was invalid.

## Verification

`npm run test:rules` runs eight Firestore emulator security tests. It requires Java and the Firebase emulator download. The browser test uses Playwright with Chromium, a static server on port 8001 serving the project root, and Authentication and Firestore emulators on ports 9099 and 8080. Run `node test/two-player.cjs` while those servers are running. Set PLAYWRIGHT_MODULE and CHROMIUM_PATH if they are installed outside normal paths.

The evidence notes in the app describe every statistical denominator. Awards are playful narration, not clinical assessments. Selected excerpts are intentionally included in the app, so the repository should remain private.
