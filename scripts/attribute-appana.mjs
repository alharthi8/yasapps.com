import fs from 'node:fs/promises';
const file='public/index.html';
let html=await fs.readFile(file,'utf8');
html=html.replace(' BUILT IN THE UAE. MADE FOR EVERYWHERE.',' UAE-BUILT. EMIRATI MINDS. GLOBAL AMBITION.');
html=html.replace('<p class="eyebrow">UAE ROOTS. A SHARED FUTURE.</p>','<p class="eyebrow"><span class="uae-flag" role="img" aria-label="United Arab Emirates flag"></span> UAE ROOTS. A SHARED FUTURE.</p>');
html=html.replace('<h2>Good software grows<br>with good company.</h2>','<h2>Great Emirati minds.<br>A world of possibility.</h2><p class="appana-attribution">Yas Apps is a UAE-based product family, designed and built by <a href="https://appana.ae" target="_blank" rel="noopener noreferrer">Appana Technologies</a>. Created by UAE nationals, with a shared ambition to build thoughtful software for the world.</p>');
html=html.replace('Made with intention. Built with Rust.','Designed and built by <a href="https://appana.ae" target="_blank" rel="noopener noreferrer">Appana Technologies ↗</a>');
html=html.replace('<span>Built in the UAE. Open to the world.</span>','<span>Proudly UAE-based. Built by Emirati minds.</span>');
await fs.writeFile(file,html);
