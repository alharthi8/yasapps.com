import fs from 'node:fs/promises';
let html=await fs.readFile('public/index.html','utf8');
const changes=[
['Meet a browser and an inbox built with <strong>Rust</strong>','Meet an open-source browser and inbox built with <strong>Rust</strong>'],
['<div>Community in mind</div>','<div>Open-source code</div>'],
['href="#browser-details">What’s inside','href="https://github.com/alharthi8/yas-browser" target="_blank" rel="noopener noreferrer">Source on GitHub'],
['href="#mail-details">Preview details','href="https://github.com/alharthi8/yas-mail" target="_blank" rel="noopener noreferrer">Source on GitHub'],
['Public app repositories and licenses are being prepared.<br>Source links will appear here when published.','<a href="https://github.com/alharthi8/yas-browser" target="_blank" rel="noopener noreferrer">Yas Browser source ↗</a> &nbsp; · &nbsp; <a href="https://github.com/alharthi8/yas-mail" target="_blank" rel="noopener noreferrer">Yas Mail source ↗</a><br>MIT-licensed app code. Third-party components retain their licenses.'],
['Help shape what Yas becomes. Follow development, share an idea, and be part of the journey toward community-built desktop apps.','Help shape what Yas becomes. Read the code, report an issue, or contribute your first pull request. Both apps are open source, with room for your ideas.'],
['Public repositories and licenses are being prepared for publication under the alharthi8 GitHub account. Follow the linked profile for now. We’ll add direct source, issue, and contribution links once the repositories are public.','The Windows preview source is public: <a href="https://github.com/alharthi8/yas-browser" target="_blank" rel="noopener noreferrer">Yas Browser on GitHub</a> and <a href="https://github.com/alharthi8/yas-mail" target="_blank" rel="noopener noreferrer">Yas Mail on GitHub</a>. Yas-owned code uses the MIT license; third-party components retain their own licenses. Each repository includes contribution guidance and an issue tracker.'],
['/downloads/Yas-Browser-0.4.5-Windows-x64.exe','https://github.com/alharthi8/yas-browser/releases/download/v0.4.5/Yas-Browser-0.4.5-Windows-x64.exe'],
['/downloads/Yas-Mail-0.3.0-Windows-x64.exe','https://github.com/alharthi8/yas-mail/releases/download/v0.3.0/Yas-Mail-0.3.0-Windows-x64.exe']
];
for(const [from,to] of changes) html=html.replaceAll(from,to);
await fs.writeFile('public/index.html',html);
console.log('Published app repositories and versioned release links applied.');
