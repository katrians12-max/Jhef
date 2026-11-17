/* ===== Utilitários, ícones e o rosto do Bip ===== */
const $=id=>document.getElementById(id);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
/* clareia (f>0) ou escurece (f<0) uma cor #rrggbb */
function shade(hex,f){const n=parseInt(hex.slice(1),16),t=f<0?0:255,k=Math.abs(f);let r=n>>16,g=n>>8&255,b=n&255;
 r=Math.round(r+(t-r)*k);g=Math.round(g+(t-g)*k);b=Math.round(b+(t-b)*k);return "#"+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}
const ICONS={
 up:'<path d="M12 20V5M5 12l7-7 7 7"/>',
 turnL:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
 turnR:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
 jump:'<path d="M3 19c1.5-9.5 12-13 17-5"/><path d="M21 8.5V14h-5.5"/>',
 brush:'<path d="M20.5 3.5a2.1 2.1 0 0 1 0 3L12 15l-3-3 8.5-8.5a2.1 2.1 0 0 1 3 0Z"/><path d="M9 12c-2.8 0-5 1.8-5 4.500 0 1.600-1 2.600-2 3.200 3.400.8 9 .3 9-4.700"/>',
 repeat:'<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
 until:'<path d="M4 10a8 8 0 1 1 8 8H4"/><path d="m8 22-4-4 4-4"/>',
 split:'<path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.300a4 4 0 0 0-1.170-2.830L3 3"/><path d="m15 9 6-6"/>',
 play:'<path d="M7 4.500v15l12-7.500z" fill="currentColor"/>',
 stop:'<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
 step:'<path d="M5 4.500v15l9-7.500z" fill="currentColor"/><path d="M18.500 5v14"/>',
 undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.500a5.500 5.500 0 0 1 0 11H11"/>',
 home:'<path d="M3 11.500 12 4l9 7.500"/><path d="M5.500 10v10h13V10"/><path d="M10 20v-5.500h4V20"/>',
 trash:'<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
 left:'<path d="m15 18-6-6 6-6"/>',right:'<path d="m9 18 6-6-6-6"/>',down:'<path d="m6 9 6 6 6-6"/>',
 sound:'<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.500 8.500a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>',
 mute:'<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/>',
 sliders:'<path d="M4 6h9M19 6h1M4 12h2M12 12h8M4 18h7M17 18h3"/><circle cx="16" cy="6" r="2.500"/><circle cx="9" cy="12" r="2.500"/><circle cx="14" cy="18" r="2.500"/>',
 eye:'<path d="M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
 bulb:'<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.100 14c.2-1 .7-1.700 1.400-2.500A6 6 0 1 0 7.500 11.500c.7.8 1.200 1.500 1.400 2.500"/>',
 x:'<path d="M18 6 6 18M6 6l12 12"/>',
 lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
 key:'<circle cx="7.500" cy="15.500" r="4.500"/><path d="m10.700 12.300 9.300-9.300"/><path d="m16 7 3 3"/>',
 pin:'<path d="M12 21s-7-6.200-7-11.500a7 7 0 0 1 14 0C19 14.800 12 21 12 21Z"/><circle cx="12" cy="9.500" r="2.500"/>',
 bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none"/>',
 wrench:'<path d="M14.700 6.300a1 1 0 0 0 0 1.400l1.600 1.600a1 1 0 0 0 1.400 0l3.770-3.770a6 6 0 0 1-7.940 7.940l-6.910 6.910a2.120 2.120 0 0 1-3-3l6.910-6.910a6 6 0 0 1 7.940-7.940l-3.760 3.760z"/>',
 star:'<path d="M12 2.500l2.900 6 6.600.8-4.900 4.500 1.300 6.500L12 17l-5.900 3.300 1.300-6.500L2.500 9.300l6.600-.8z" fill="currentColor" stroke="none"/>',
 compass:'<circle cx="12" cy="12" r="9.500"/><path d="m15.500 8.500-2 5-5 2 2-5z"/>',
 check:'<path d="M20 6 9 17l-5-5"/>',
 map:'<path d="M9 4 3 6.500v13.500l6-2.500 6 2.500 6-2.500V4l-6 2.500z"/><path d="M9 4v13.500M15 6.500V20"/>',
 skip:'<path d="M5 5v14l9-7z" fill="currentColor"/><path d="M19 5v14"/>'
};
const ic=(n,cls="")=>`<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]||""}</svg>`;
/* Rosto do Bip para a interface. Humor: normal, happy, sad, think */
function bip(mood="normal"){
 const eyes={
  normal:'<circle cx="18.500" cy="22" r="3.600" fill="#7df0ff"/><circle cx="29.500" cy="22" r="3.600" fill="#7df0ff"/>',
  happy:'<path d="M14.800 23.500c1.800-3.600 5.600-3.600 7.400 0M25.800 23.500c1.800-3.600 5.600-3.600 7.400 0" fill="none" stroke="#ffd94a" stroke-width="2.800" stroke-linecap="round"/>',
  sad:'<path d="M15 19.500l6 2.500M33 19.500l-6 2.500" fill="none" stroke="#ff8f8f" stroke-width="2.200" stroke-linecap="round"/><circle cx="18.500" cy="25" r="2.400" fill="#ff8f8f"/><circle cx="29.500" cy="25" r="2.400" fill="#ff8f8f"/>',
  think:'<circle cx="19.500" cy="21.500" r="3.400" fill="#7df0ff"/><circle cx="30.500" cy="21.500" r="3.400" fill="#7df0ff"/><circle cx="20.800" cy="20.300" r="1.300" fill="#1b2230"/><circle cx="31.800" cy="20.300" r="1.300" fill="#1b2230"/>'}[mood];
 return `<svg class="bip" viewBox="0 0 48 44" aria-hidden="true"><path d="M24 9V4.500" stroke="#5b626c" stroke-width="2.500" stroke-linecap="round"/><circle cx="24" cy="4" r="3.200" fill="#ff5a3d" stroke="#15233a" stroke-width="1.500"/>
<rect x="2.500" y="18" width="6" height="11" rx="2.500" fill="#69717c" stroke="#15233a" stroke-width="1.500"/><rect x="39.500" y="18" width="6" height="11" rx="2.500" fill="#69717c" stroke="#15233a" stroke-width="1.500"/>
<rect x="6.500" y="9" width="35" height="30" rx="8" fill="var(--skin)" stroke="#15233a" stroke-width="2"/><rect x="11" y="15" width="26" height="14.500" rx="5.500" fill="#1b2230"/>${eyes}
<rect x="18" y="32.800" width="12" height="2.600" rx="1.300" fill="#15233a" opacity=".5"/></svg>`}
