# Signed desktop releases — Windows GitHub updates

Both public app repositories now include `ota.rs`, app-specific `release.pub` verification keys, and `.github/workflows/release.yml`. The implementation uses self_update/self-replace with mandatory zipsign Ed25519 verification and GitHub checksum checking, rather than separate updater formats for each app. The steps below record the original design; this implementation supersedes the proposed Tauri-only integration.

Users install the updater-enabled bootstrap once: Browser 0.4.6 or Mail 0.3.1. Then use Settings → Check for app updates, or the startup check. Users approve downloading and applying an update; the current session stays open. Fully quit and reopen when convenient. Browser users with tray downloads need Exit Yas. User-data directories are not replaced.

Maintainers bump Cargo versions (and Browser branding/yas.rc / Mail tauri.conf.json), commit, and push a matching vVERSION tag to the app repository. Actions builds/tests, signs a version-bound ZIP, checks that the compiled app accepts it and rejects a corrupted copy, uploads a draft with the bootstrap installer, and publishes it as latest. Only published latest releases are offered. Update the website's version/size/download links from verified release metadata for new visitors.

The per-repository GitHub Actions signing secret is YAS_UPDATE_SIGNING_KEY. Private backups are outside Git in the Windows user's .codex/secrets/yas-updates directory, restricted to that owner and SYSTEM. Keep them backed up; do not publish or casually rotate them. Installed apps embed the corresponding public key. Version-bound signature contexts prevent relabeling an older signed package as a newer one.

The current update format replaces the executable in writable per-user installations or portable copies. New runtime dependencies or installation-layout changes need a full installer. OS publisher signing is separate and is not configured. macOS updates remain unavailable until a port, signed/notarized packaging, and update tests exist.

