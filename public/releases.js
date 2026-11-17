// Website launch status. Keep platform copy and download admission in sync.
export const BROWSER_RELEASES = Object.freeze({
  windows: Object.freeze({ available: true, version: '0.4.9', label: 'Available now', platformLabel: 'Windows 10/11 · 64-bit', buttonLabel: 'Download for Windows' }),
  macos: Object.freeze({ available: false, label: 'Coming soon', platformLabel: 'macOS · In development', buttonLabel: 'macOS coming soon' }),
});

export const PIPELINE_PRODUCTS = Object.freeze([
  Object.freeze({ id: 'mail', name: 'Yas Mail' }),
  Object.freeze({ id: 'connect', name: 'Yas Connect' }),
  Object.freeze({ id: 'agent', name: 'Yas Agent' }),
]);
