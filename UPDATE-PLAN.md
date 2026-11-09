# Signed desktop releases

1. Prepare public `alharthi8` repositories after a source/secret and license review.
2. Generate an app-specific signing keypair; back up the private key outside source control and store CI access as a GitHub Actions secret. Only public verification keys belong in app source.
3. For Yas Mail, configure `YAS_MAIL_UPDATE_MANIFEST_URL` and `YAS_MAIL_UPDATE_PUBLIC_KEY` for builds. Development source currently contains Tauri updater support; existing distributed previews are not established as update-enabled.
4. Publish a bootstrap release that contains the updater and public key. Existing users install it manually once.
5. GitHub Actions builds on a version tag, tests, signs native installers, generates updater signatures, and uploads versioned assets to GitHub Releases. macOS also requires Developer ID signing/notarization and tested Apple Silicon/Intel targets.
6. Publish a Tauri-compatible `latest.json` only after all intended platform artifacts and their signatures are uploaded. Keep beta/stable feeds separate. Protect release permissions.
7. Point the app's HTTPS feed to the real GitHub release manifest or a stable yasapps.com route. Don't ship placeholder feeds or unsigned packages.
8. App checks on launch and on demand, shows notes, downloads the correct platform build, verifies the signature, and offers install/restart. Preserve user data, avoid interrupting sends/downloads, and handle interrupted downloads and invalid signatures.
9. Yas Browser is Wry/Tao rather than Tauri. Implement a verified Windows updater/helper and a suitable macOS mechanism; do not assume the Tauri plugin can simply be enabled there.

OS publisher signing and updater artifact signing are different. Both are required for a polished release. Keep an older signed release available, but don't bypass version/signature checks to force a rollback; normally publish a repaired higher version.

Current source inspected: Yas Mail `src-tauri/src/release.rs`; Yas Browser `src/main.rs`. This plan does not modify either product while their other chats are actively editing them.
