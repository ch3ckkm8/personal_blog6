window.ThemeManager = (function () {

  /**
   * Swap the toggle button icon to match the current theme.
   * Safe to call before the button exists — silently no-ops.
   *
   * @param {string} theme – 'dark' | 'light'
   */
  function updateIcon(theme) {
    const $icon = $('#dark-mode-toggle i');
    if (!$icon.length) return;

    if (theme === 'dark') {
      $icon.removeClass('bi-moon-stars-fill').addClass('bi-sun-fill');
    } else {
      $icon.removeClass('bi-sun-fill').addClass('bi-moon-stars-fill');
    }
  }

  /**
   * Apply a theme to <html> and persist it.
   *
   * @param {string} theme – 'dark' | 'light'
   */
  function applyTheme(theme) {
    $('html').attr('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
    updateIcon(theme);
  }

  /* ── Init ────────────────────────────────────────────────────── */
  $(document).ready(function () {

    // Event delegation: works even though the button is injected
    // asynchronously by components.js (which runs after this file).
    $(document).on('click', '#dark-mode-toggle', function () {
      const current = $('html').attr('data-bs-theme') || 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });

  });

  // Public API used by components.js
  return { updateIcon, applyTheme };

}());


window.AccentManager = (function () {
  const palettes = [
    { id: 'green',  label: 'Green' },
    { id: 'red',    label: 'Red' },
    { id: 'cyan',   label: 'Cyan' },
    { id: 'orange', label: 'Orange' },
    { id: 'purple', label: 'Light purple' }
  ];

  function current() {
    const saved = localStorage.getItem('accentPalette');
    return palettes.some(p => p.id === saved) ? saved : 'green';
  }

  function syncButton() {
    const id = document.documentElement.getAttribute('data-accent') || current();
    const palette = palettes.find(p => p.id === id) || palettes[0];
    const button = document.getElementById('accent-palette-toggle');
    if (!button) return;
    button.title = `Accent: ${palette.label} — click to change`;
    button.setAttribute('aria-label', `Current accent ${palette.label}. Click to cycle accent color`);
  }

  function apply(id, persist = true) {
    const palette = palettes.find(p => p.id === id) || palettes[0];
    document.documentElement.setAttribute('data-accent', palette.id);
    if (persist) localStorage.setItem('accentPalette', palette.id);
    syncButton();
    window.dispatchEvent(new CustomEvent('accentchange', { detail: { accent: palette.id } }));
  }

  function cycle() {
    const id = document.documentElement.getAttribute('data-accent') || current();
    const index = Math.max(0, palettes.findIndex(p => p.id === id));
    apply(palettes[(index + 1) % palettes.length].id);
    const button = document.getElementById('accent-palette-toggle');
    if (button) {
      button.classList.add('is-cycling');
      setTimeout(() => button.classList.remove('is-cycling'), 230);
    }
  }

  // Apply before components are injected; this prevents a green flash on navigation.
  apply(current(), false);

  $(document).on('click', '#accent-palette-toggle', cycle);
  return { apply, cycle, syncButton, palettes };
}());

window.BackgroundManager = (function () {
  const palettes = [
    { id:'default', label:'Default' },
    { id:'slate', label:'Slate' },
    { id:'blue', label:'Midnight blue' },
    { id:'violet', label:'Violet' },
    { id:'warm', label:'Warm' },
    { id:'forest', label:'Forest' },
    { id:'city', label:'Night City' }
  ];
  function current(){ const s=localStorage.getItem('backgroundPalette'); return palettes.some(p=>p.id===s)?s:'default'; }
  function syncButton(){ const id=document.documentElement.getAttribute('data-background')||current(); const p=palettes.find(x=>x.id===id)||palettes[0]; const b=document.getElementById('background-palette-toggle'); if(!b)return; b.title=`Background: ${p.label} — click to change`; b.setAttribute('aria-label',`Current background ${p.label}. Click to cycle page background`); }
  function apply(id,persist=true){ const p=palettes.find(x=>x.id===id)||palettes[0]; document.documentElement.setAttribute('data-background',p.id); if(persist)localStorage.setItem('backgroundPalette',p.id); syncButton(); window.dispatchEvent(new CustomEvent('backgroundchange',{detail:{background:p.id}})); }
  function cycle(){ const id=document.documentElement.getAttribute('data-background')||current(); const i=Math.max(0,palettes.findIndex(p=>p.id===id)); apply(palettes[(i+1)%palettes.length].id); const b=document.getElementById('background-palette-toggle'); if(b){b.classList.add('is-cycling');setTimeout(()=>b.classList.remove('is-cycling'),230);} }
  let cityTimer = null;
  function ensureCityScene(){
    let scene=document.getElementById('night-city-scene');
    if(scene) return scene;
    scene=document.createElement('div'); scene.id='night-city-scene'; scene.setAttribute('aria-hidden','true');
    scene.innerHTML='<div class="night-city-room"><div class="night-city-window"><div class="night-city-skyline"></div></div></div>';
    document.body.appendChild(scene);
    const skyline=scene.querySelector('.night-city-skyline');
    const specs=[[0,16,43],[9,13,55],[18,18,37],[30,12,67],[39,17,49],[53,11,72],[62,16,42],[75,13,61],[85,16,48],[94,9,69]];
    specs.forEach((sp,bi)=>{ const b=document.createElement('div'); b.className='city-building'; b.style.left=sp[0]+'%'; b.style.width=sp[1]+'%'; b.style.height=sp[2]+'%'; skyline.appendChild(b);
      const cols=Math.max(2,Math.floor(sp[1]/2.3)), rows=Math.max(3,Math.floor(sp[2]/7));
      for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){ if(Math.random()<.18) continue; const w=document.createElement('span'); w.className='city-window'; w.style.left=(10+c*(80/Math.max(1,cols-1)))+'%'; w.style.top=(10+r*(78/Math.max(1,rows-1)))+'%'; if(Math.random()<.28) w.classList.add(Math.random()<.58?'warm':'cyan'); if(Math.random()<.3) w.classList.add('on'); b.appendChild(w); }
    }); return scene;
  }
  function updateCityAnimation(){
    if(cityTimer){clearInterval(cityTimer);cityTimer=null;}
    if((document.documentElement.getAttribute('data-background')||current())!=='city') return;
    const scene=ensureCityScene(), windows=[...scene.querySelectorAll('.city-window')];
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    cityTimer=setInterval(()=>{ const n=1+Math.floor(Math.random()*3); for(let i=0;i<n;i++){ const w=windows[Math.floor(Math.random()*windows.length)]; if(w) w.classList.toggle('on'); } },2600+Math.floor(Math.random()*1400));
  }
  const oldApply=apply;
  apply=function(id,persist=true){ oldApply(id,persist); if(id==='city') ensureCityScene(); updateCityAnimation(); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{ if(current()==='city') ensureCityScene(); updateCityAnimation(); }); else { if(current()==='city') ensureCityScene(); updateCityAnimation(); }
  apply(current(),false);
  $(document).on('click','#background-palette-toggle',cycle);
  return {apply,cycle,syncButton,palettes};
}());
