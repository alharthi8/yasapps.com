import fs from 'node:fs/promises';
const products=[{repo:'yas-browser',version:'0.4.6',old:'0.4.5',oldSize:'7.1'},{repo:'yas-mail',version:'0.3.1',old:'0.3.0',oldSize:'4.7'}];
let html=await fs.readFile('public/index.html','utf8');let js=await fs.readFile('public/app.js','utf8');const config=JSON.parse(await fs.readFile('vercel.json','utf8'));let sums=[];
for(const p of products){
 const response=await fetch(`https://api.github.com/repos/alharthi8/${p.repo}/releases/tags/v${p.version}`);if(!response.ok)throw Error(`${p.repo}: signed bootstrap release is not published yet`);const release=await response.json();
 if(release.draft||release.prerelease)throw Error('Bootstrap must be on the published update channel');
 if(!release.assets.some(a=>a.name===`${p.repo}-ota-${p.version}-x86_64-pc-windows-msvc.zip`))throw Error('Signed update asset is missing');
 const installer=release.assets.find(a=>/setup.*\.exe$|setup\.exe$/i.test(a.name));if(!installer||!/^sha256:[0-9a-f]{64}$/.test(installer.digest||''))throw Error('Verified installer metadata is missing');
 const oldUrl=p.repo==='yas-browser'?'https://github.com/alharthi8/yas-browser/releases/download/v0.4.5/Yas-Browser-0.4.5-Windows-x64.exe':'https://github.com/alharthi8/yas-mail/releases/download/v0.3.0/Yas-Mail-0.3.0-Windows-x64.exe';
 html=html.replaceAll(oldUrl,installer.browser_download_url).replaceAll(p.old,p.version).replaceAll(p.oldSize+' MB',(installer.size/1e6).toFixed(1)+' MB');
 js=js.replaceAll(p.old,p.version).replaceAll(p.oldSize+' MB',(installer.size/1e6).toFixed(1)+' MB');
 for(const redirect of config.redirects)if(redirect.destination===oldUrl)redirect.destination=installer.browser_download_url;
 sums.push(installer.digest.slice(7)+'  '+installer.name);
}
html=html.replace('We’re preparing signed, versioned releases. Yas Mail’s development source includes Tauri updater integration, but public update feeds and signing configuration are not live yet. Yas Browser needs its updater integration. For now, download the current installer here.','Install the current Windows preview once to enable signed GitHub updates. Both apps check on startup and offer Settings → Check for app updates. Approve the download to apply the verified update, then fully quit and reopen when convenient. The current session stays open. These signatures verify update authenticity; Windows publisher signing is separate. macOS updates are not available yet.');
await fs.writeFile('public/index.html',html);await fs.writeFile('public/app.js',js);await fs.writeFile('vercel.json',JSON.stringify(config,null,2)+'\n');await fs.writeFile('public/downloads/SHA256SUMS.txt',sums.join('\n')+'\n');
console.log('Published signed-bootstrap releases connected to website downloads.');
