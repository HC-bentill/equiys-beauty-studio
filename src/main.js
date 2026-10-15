import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import lottie from 'lottie-web';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import './style.css';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WHATSAPP = '233241647946'; // bookings go to 024 164 7946 (digits only, with Ghana's 233 code)

/* ---------------- Three.js stage ---------------- */
const canvas = document.getElementById('stage');
let renderer;
try { renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true}); } catch(e) { canvas.remove(); }
const story = { p:0, target:0 };
if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x170c14, 0); // glass refracts the page colour, not white
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
  camera.position.set(0, .3, 11);

  // studio lighting for reflections: a softbox room, plus a blush and a violet panel for colour in the glass
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const tint = (c, x, y, z, w, h, k = 1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(k), side:THREE.DoubleSide})); m.position.set(x, y, z); m.lookAt(0, 0, 0); room.add(m); };
  tint(0xffc9d6, 6.5, 1, 2, 1.2, 6, 4); tint(0x9b6bff, -6.5, -1, -2, 1.2, 5, 4);
  scene.environment = pmrem.fromScene(room, .02).texture;
  scene.environmentIntensity = .75;

  /* ---- nail polish bottle, built to real proportions (15 mL square bottle, ridged cap, brush inside) ---- */
  const group = new THREE.Group(); scene.add(group);
  const bottle = new THREE.Group(); group.add(bottle);

  // body: thick, clear, refractive glass with a heavy base, like a real lacquer bottle
  const BW = 1.95, BH = 2.05, BD = 1.25, BY = -.2;           // width, height, depth, centre
  const glassMat = new THREE.MeshPhysicalMaterial({
    color:0xffffff, metalness:0, roughness:.02, transmission:1, thickness:.55, ior:1.5,
    attenuationColor:new THREE.Color(0xf4ecff), attenuationDistance:4, specularIntensity:.8,
    clearcoat:.6, clearcoatRoughness:.02, envMapIntensity:.75 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(BW, BH, BD, 8, .3), glassMat);
  body.position.y = BY; bottle.add(body);

  // lacquer inside: fills to ~70%, with a softly rounded surface; opaque, glossy, slightly emissive under UV
  const polishMat = new THREE.MeshPhysicalMaterial({color:0x7a0f2e, roughness:.12, metalness:0, clearcoat:1, clearcoatRoughness:.03, envMapIntensity:.55});
  const FILL = 1.3, base = BY - BH / 2 + .22;                  // thick glass floor
  const lacquer = new THREE.Mesh(new RoundedBoxGeometry(BW - .3, FILL, BD - .3, 6, .2), polishMat);
  lacquer.position.y = base + FILL / 2; bottle.add(lacquer);

  // neck with screw threads (glass)
  const shoulderY = BY + BH / 2;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.36, .4, .34, 64), glassMat);
  neck.position.y = shoulderY + .1; bottle.add(neck);
  for (let k = 0; k < 2; k++) { const th = new THREE.Mesh(new THREE.TorusGeometry(.385, .022, 10, 64), glassMat); th.rotation.x = Math.PI / 2; th.position.y = shoulderY + .14 + k * .1; bottle.add(th); }

  // brush stem + bristles, visible through the glass above the lacquer line
  const stemMat = new THREE.MeshPhysicalMaterial({color:0x1a1014, roughness:.35, clearcoat:.5});
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, BH - .25, 24), stemMat);
  stem.position.y = shoulderY - (BH - .25) / 2 + .2; bottle.add(stem);
  // flat, tapered brush head coated in lacquer, with a bead of polish at the tip
  const bristles = new THREE.Mesh(new THREE.CylinderGeometry(.11, .15, .62, 32), polishMat);
  bristles.scale.set(1.25, 1, .5); bristles.position.y = base + .45; bottle.add(bristles);
  const bead = new THREE.Mesh(new THREE.SphereGeometry(.1, 24, 16), polishMat);
  bead.scale.set(1.5, .9, .7); bead.position.y = base + .12; bottle.add(bead);

  // cap: tall, soft-touch black with fine vertical ridges, a bevelled top and a gold collar
  const capMat = new THREE.MeshPhysicalMaterial({color:0x140a10, roughness:.55, metalness:.05, clearcoat:.25, clearcoatRoughness:.4, envMapIntensity:.8});
  const CAPH = 2.05, CAPR = .5;
  const capGeo = new THREE.CylinderGeometry(CAPR, CAPR, CAPH, 192, 1, true);
  const pos = capGeo.attributes.position, v = new THREE.Vector3();
  for (let k = 0; k < pos.count; k++) {
    v.fromBufferAttribute(pos, k);
    const ang = Math.atan2(v.z, v.x), ridge = 1 + .022 * Math.pow(Math.abs(Math.cos(ang * 36)), .5);
    pos.setXYZ(k, v.x * ridge, v.y, v.z * ridge);
  }
  capGeo.computeVertexNormals();
  const cap = new THREE.Mesh(capGeo, capMat);
  const capY = shoulderY + .32 + CAPH / 2; cap.position.y = capY; bottle.add(cap);
  const V = (r, y) => new THREE.Vector2(r, y);
  const capTop = new THREE.Mesh(new THREE.LatheGeometry([V(0, .1), V(.38, .1), V(.47, .07), V(.51, 0)], 96), capMat);
  capTop.position.y = capY + CAPH / 2; bottle.add(capTop);
  const goldMat = new THREE.MeshStandardMaterial({color:0xd9b27c, roughness:.18, metalness:1, envMapIntensity:1.5});
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.53, .53, .1, 96), goldMat);
  collar.position.y = capY - CAPH / 2 + .02; bottle.add(collar);

  // cap + brush move together: a pivot at the neck lets the cap unscrew (spin), lift out and tilt aside
  const pivotY = shoulderY + .32;
  const capLift = new THREE.Group(); capLift.position.y = pivotY; bottle.add(capLift);  // lift + tilt
  const capRig = new THREE.Group(); capLift.add(capRig);                                  // unscrew spin
  [cap, capTop, collar, stem, bristles, bead].forEach(m => { bottle.remove(m); m.position.y -= pivotY; capRig.add(m); });

  // printed label on the front face of the glass
  const lc = document.createElement('canvas'); lc.width = 1024; lc.height = 512;
  const lx = lc.getContext('2d');
  const labelTex = new THREE.CanvasTexture(lc); labelTex.colorSpace = THREE.SRGBColorSpace; labelTex.anisotropy = 8;
  function drawLabel(){
    lx.clearRect(0, 0, 1024, 512); lx.fillStyle = 'rgba(255,248,244,.95)'; lx.textAlign = 'center';
    lx.font = 'italic 500 150px "Bodoni Moda", Didot, Georgia, serif'; lx.fillText("Equiy's", 512, 250);
    lx.font = '500 34px "DM Mono", Menlo, monospace'; lx.fillText('B E A U T Y   S T U D I O', 512, 330);
    lx.fillRect(432, 372, 160, 2);
    lx.font = '400 28px "DM Mono", Menlo, monospace'; lx.fillStyle = 'rgba(255,248,244,.75)'; lx.fillText('GEL LACQUER · 15 mL / 0.5 fl oz', 512, 430);
    labelTex.needsUpdate = true;
  }
  drawLabel(); document.fonts && document.fonts.ready.then(drawLabel);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.45, .725), new THREE.MeshPhysicalMaterial({map:labelTex, transparent:true, roughness:.3, clearcoat:1, depthWrite:false}));
  label.position.set(0, BY - .12, BD / 2 + .004); bottle.add(label);

  // soft contact shadow that travels with the bottle
  const sc = document.createElement('canvas'); sc.width = sc.height = 128; const sx = sc.getContext('2d');
  const sg = sx.createRadialGradient(64, 64, 0, 64, 64, 64); sg.addColorStop(0, 'rgba(0,0,0,.55)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
  sx.fillStyle = sg; sx.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.4), new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc), transparent:true, depthWrite:false}));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = BY - BH / 2 - .02; bottle.add(shadow);

  bottle.position.y = -.9; bottle.rotation.z = -.12;

  // hair strands that wrap the bottle in the LENGTH chapter
  const strands = new THREE.Group(); group.add(strands);
  const hairMat = new THREE.MeshPhysicalMaterial({color:0x2b1812, roughness:.32, metalness:.25, clearcoat:.6, envMapIntensity:1.3});
  const strandMeshes = [];
  for (let s = 0; s < 16; s++) {
    const pts = [], a0 = s / 16 * Math.PI * 2, r0 = 1.7 + (s % 4) * .12;
    for (let k = 0; k <= 60; k++) { const t = k / 60, a = a0 + t * Math.PI * 2.6, r = r0 + Math.sin(t * 9 + s) * .12; pts.push(new THREE.Vector3(Math.cos(a)*r, 2.6 - t*5.4, Math.sin(a)*r)); }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, .022 + (s%3)*.006, 6, false);
    geo.setDrawRange(0, 0);
    const m = new THREE.Mesh(geo, hairMat); strands.add(m); strandMeshes.push(m);
  }

  // glitter
  const N = REDUCED ? 260 : 700, gpos = new Float32Array(N*3), gseed = new Float32Array(N*3);
  for (let i = 0; i < N; i++) { const u = Math.random()*2-1, th = Math.random()*Math.PI*2, r = 1.9 + Math.random()*2.2, q = Math.sqrt(1-u*u);
    gseed[i*3] = q*Math.cos(th)*r; gseed[i*3+1] = u*r*.9 + .3; gseed[i*3+2] = q*Math.sin(th)*r; }
  const gGeo = new THREE.BufferGeometry(); gGeo.setAttribute('position', new THREE.BufferAttribute(gpos, 3));
  const dot = document.createElement('canvas'); dot.width = dot.height = 64; const dx = dot.getContext('2d');
  const rg = dx.createRadialGradient(32,32,0,32,32,32); rg.addColorStop(0,'rgba(255,255,255,1)'); rg.addColorStop(.3,'rgba(255,230,210,.8)'); rg.addColorStop(1,'rgba(255,255,255,0)');
  dx.fillStyle = rg; dx.fillRect(0,0,64,64);
  const dotTex = new THREE.CanvasTexture(dot);
  const gMat = new THREE.PointsMaterial({size:.09, map:dotTex, color:0xf3d2b8, transparent:true, opacity:.75, depthWrite:false, blending:THREE.AdditiveBlending});
  const glitter = new THREE.Points(gGeo, gMat); group.add(glitter);

  // lights + the UV lamp
  scene.add(new THREE.HemisphereLight(0xffe7df, 0x1a0b16, .55 * Math.PI));
  const key = new THREE.DirectionalLight(0xfff1ea, 1.6 * Math.PI); key.position.set(-4, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffc6d6, 1.1 * Math.PI); rim.position.set(5, 2, -4); scene.add(rim);
  const uv = new THREE.PointLight(0x8b5cff, 0, 9, 2); group.add(uv);
  const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex, color:0x9b6bff, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending}));
  glowSprite.scale.set(5,5,1); group.add(glowSprite);

  // chapter looks: hero, cure, shape, length, finish
  const looks = [
    {c:0x7a0f2e, uv:.15, hair:0, burst:0, tilt:-.12},
    {c:0x9e0a3c, uv:1,   hair:0, burst:.1, tilt:-.05},
    {c:0xd8a08f, uv:.2,  hair:0, burst:0, tilt:.18},
    {c:0xc69652, uv:.1,  hair:1, burst:0, tilt:0},
    {c:0xc0396a, uv:.45, hair:0, burst:1, tilt:-.15},
  ];
  const cA = new THREE.Color(), cB = new THREE.Color();
  const lerp = (a,b,t) => a + (b-a)*t;
  const ease = t => t*t*(3-2*t);

  let W = 0, H = 0, mobile = false;
  function resize(){
    W = innerWidth; H = innerHeight; mobile = W < 760;
    renderer.setSize(W, H, false); camera.aspect = W/H; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  // drag to rotate (horizontal), vertical stays as page scroll
  let rotY = .4, vel = REDUCED ? 0 : .004, dragging = false, lastX = 0;
  const interactive = 'a,button,input,select,textarea,label,.rail,form';
  addEventListener('pointerdown', e => {
    if (e.target.closest(interactive) || e.target.closest('.solid')) return;
    dragging = true; lastX = e.clientX;
  });
  addEventListener('pointermove', e => { if (!dragging) return; const d = e.clientX - lastX; lastX = e.clientX; rotY += d * .01; vel = d * .0015; });
  addEventListener('pointerup', () => dragging = false);
  addEventListener('pointercancel', () => dragging = false);

  const clock = new THREE.Clock();
  let visible = true;
  function frame(){
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    story.p = REDUCED ? story.target : lerp(story.p, story.target, .08);
    const x = story.p * 4, i = Math.min(3, Math.floor(x)), f = ease(Math.min(1, x - i));

    // open / close: closed at rest, unscrews and lifts out over the first chapter,
    // stays open through the story, then slowly closes so it is shut before the shade bar and menu
    const c01 = v => Math.max(0, Math.min(1, v));
    const open = ease(c01((story.p - .02) / .23)) * (1 - ease(c01((story.p - .74) / .24)));
    const twist = ease(c01(open / .35));            // first part: unscrew in place
    const lift = ease(c01((open - .3) / .7));        // then: lift the brush out and tip it aside
    capRig.rotation.y = -twist * Math.PI * 3;
    capLift.position.set(lift * .7, pivotY + lift * 2.15, lift * .15);
    capLift.rotation.z = -lift * .42;
    capLift.rotation.x = lift * .08;
    const a = looks[i], b = looks[i+1];

    cA.setHex(a.c); cB.setHex(b.c); polishMat.color.copy(cA.lerp(cB, f));
    const uvAmt = lerp(a.uv, b.uv, f), hairAmt = lerp(a.hair, b.hair, f), burst = lerp(a.burst, b.burst, f);

    // UV lamp orbits and swells with scroll
    const ua = t * .7;
    uv.position.set(Math.cos(ua) * 2.4, 1.6 + Math.sin(t*1.3)*.3, Math.sin(ua) * 2.4 + 1);
    uv.intensity = uvAmt * 9 * Math.PI * (0.85 + Math.sin(t*6)*.15);
    glowSprite.position.copy(uv.position);
    glowSprite.material.opacity = uvAmt * .85;
    polishMat.emissive.setHex(0x3a1080); polishMat.emissiveIntensity = uvAmt * .2;
    const bar = document.getElementById('uvbar'); if (bar) bar.style.width = Math.round(Math.min(1, uvAmt) * 100) + '%';

    // hair reveal
    strandMeshes.forEach((m, k) => { const full = m.geometry.index.count, d = Math.max(0, Math.min(1, hairAmt * 1.4 - k * .025)); m.geometry.setDrawRange(0, Math.floor(full * d / 3) * 3); });
    strands.rotation.y = t * .15;

    // glitter burst
    const spread = 1 + burst * .9;
    for (let k = 0; k < N; k++) {
      const s = k*3, w = t*.3 + k;
      gpos[s] = gseed[s]*spread + Math.sin(w)*.06; gpos[s+1] = gseed[s+1]*spread + Math.cos(w*1.3)*.06; gpos[s+2] = gseed[s+2]*spread;
    }
    gGeo.attributes.position.needsUpdate = true;
    gMat.opacity = .35 + burst * .55; gMat.size = .07 + burst * .06;
    glitter.rotation.y = -t * .05;

    // spin: drag momentum + scroll-driven turn
    if (!dragging) { vel *= .96; if (!REDUCED && Math.abs(vel) < .003) vel = .003; rotY += vel; }
    group.rotation.y = rotY + story.p * Math.PI * 3;
    bottle.rotation.z = lerp(a.tilt, b.tilt, f);
    group.rotation.x = Math.sin(t*.5)*.04;

    // placement: right of the copy on desktop, centred and higher on phones
    const bob = Math.sin(t*.8)*.08;
    if (mobile) {
      const up = ease(Math.min(1, story.p / .12));
      group.scale.setScalar(lerp(.42, .55, up) * (1 - lift * .1));
      group.position.set(lerp(1.05, 0, up), lerp(-2.05, 1.35, up) - lift * .75 + bob, 0);
    } else {
      group.scale.setScalar(.8 - lift * .08);
      group.position.set(2.4 - lift * .25, -.05 - lift * .7 + bob, 0);
    }
    renderer.render(scene, camera);
  }
  frame();

  // stop rendering once the solid sections cover the stage
  const solid = document.querySelector('.solid');
  new IntersectionObserver(([en]) => { visible = !(en.isIntersecting && en.boundingClientRect.top <= 0); }, {threshold:[0, .01]}).observe(solid);
  addEventListener('scroll', () => { visible = solid.getBoundingClientRect().top > 0; }, {passive:true});
}

/* ---------------- GSAP ScrollTrigger ---------------- */
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.create({ trigger:'#story', start:'top bottom', end:'bottom bottom', onUpdate: s => story.target = s.progress });
const marks = document.querySelectorAll('.rail-progress span');
document.querySelectorAll('.chapter').forEach((ch, i) => {
  ScrollTrigger.create({ trigger:ch, start:'top 55%', end:'bottom 45%',
    onToggle: s => { ch.classList.toggle('active', s.isActive); if (s.isActive) marks.forEach((m, k) => m.classList.toggle('on', k === i)); } });
});
if (!REDUCED) {
  // hero entrance: words rise from a visible resting state
  gsap.from('.lockup, #headline, .hero .lead, .hero .ctas, .tags li, .drag-hint', {y:24, opacity:.0001, duration:.9, ease:'power3.out', stagger:.06, clearProps:'all'});
  gsap.utils.toArray('.section-head h2').forEach(h => gsap.from(h, {y:40, duration:1, ease:'power3.out', scrollTrigger:{trigger:h, start:'top 90%'}}));
}

/* ---------------- Shade rail: scroll-snap, looped ---------------- */
const shades = [
  {n:'Cherry lacquer', f:'Gel · high gloss', c:['#8f0b2f','#8f0b2f','#8f0b2f','#8f0b2f','#8f0b2f']},
  {n:'Milk bath nude', f:'Gel · sheer', c:['#e9c3b6','#e9c3b6','#e9c3b6','#e9c3b6','#e9c3b6']},
  {n:'Ultraviolet', f:'Gel · cat-eye', c:['#5b2bd1','#7a4cf0','#5b2bd1','#7a4cf0','#5b2bd1']},
  {n:'Classic French', f:'Acrylic · tip', c:['#f2d7cf','#f2d7cf','#f2d7cf','#f2d7cf','#f2d7cf'], tip:true},
  {n:'Champagne chrome', f:'Gel · chrome powder', c:['#d9b27c','#e8cfa4','#d9b27c','#e8cfa4','#d9b27c']},
  {n:'Cocoa matte', f:'Gel · matte top', c:['#5a3324','#5a3324','#5a3324','#5a3324','#5a3324']},
  {n:'Rose ombré', f:'Acrylic · ombré', c:['#f4b8c4','#e88aa0','#d45d7d','#e88aa0','#f4b8c4']},
  {n:'Midnight glitter', f:'Gel · glitter', c:['#20163a','#2b1d52','#20163a','#2b1d52','#20163a']},
];
const rail = document.getElementById('rail');
const card = s => `<article class="shade"><div class="nails">${s.c.map(c => `<span class="nail${s.tip?' tip':''}" style="--c:${c}"></span>`).join('')}</div><h3>${s.n}</h3><div class="meta"><span>${s.f}</span></div></article>`;
const set = shades.map(card).join('');
rail.innerHTML = set + set + set;
let setW = 0, settle;
function measure(){ const kids = rail.children; setW = kids[shades.length].offsetLeft - kids[0].offsetLeft; }
function jump(d){ rail.style.scrollSnapType = 'none'; rail.scrollLeft += d; requestAnimationFrame(() => rail.style.scrollSnapType = ''); }
requestAnimationFrame(() => { measure(); rail.style.scrollBehavior = 'auto'; jump(setW); });
addEventListener('resize', () => { const off = rail.scrollLeft % setW / setW; measure(); rail.scrollLeft = setW + off * setW; });
rail.addEventListener('scroll', () => {
  clearTimeout(settle);
  settle = setTimeout(() => { if (rail.scrollLeft < setW * .5) jump(setW); else if (rail.scrollLeft > setW * 1.5) jump(-setW); }, 140);
}, {passive:true});
const step = () => rail.children[1].offsetLeft - rail.children[0].offsetLeft;
document.getElementById('next').onclick = () => rail.scrollBy({left: step(), behavior: REDUCED ? 'auto' : 'smooth'});
document.getElementById('prev').onclick = () => rail.scrollBy({left: -step(), behavior: REDUCED ? 'auto' : 'smooth'});

/* ---------------- Hair length ruler ---------------- */
const len = document.getElementById('len'), lenout = document.getElementById('lenout'), lenbar = document.getElementById('lenbar');
const where = v => v <= 12 ? 'chin to collarbone' : v <= 16 ? 'collarbone to shoulder' : v <= 20 ? 'shoulder to bra strap' : v <= 24 ? 'mid-back' : v <= 26 ? 'lower back' : 'waist and beyond';
function setLen(){ const v = +len.value; lenout.textContent = `${v}″ · ${where(v)}`; lenbar.style.setProperty('--len', ((v-8)/22).toFixed(2)); }
len.addEventListener('input', setLen); setLen();

/* ---------------- Lottie sparkle (After Effects JSON, built inline) ---------------- */
const kf = (t, s) => ({t, s, i:{x:[.4],y:[1]}, o:{x:[.6],y:[0]}});
const star = (x, y, size, delay, col) => ({
  ddd:0, ind:1, ty:4, nm:'star', sr:1, ip:0, op:90, st:0, bm:0,
  ks:{ o:{a:0,k:100}, r:{a:1,k:[kf(delay,[0]), {t:delay+60, s:[90]}]}, p:{a:0,k:[x,y,0]}, a:{a:0,k:[0,0,0]},
       s:{a:1,k:[kf(delay,[0,0,100]), kf(delay+20,[size,size,100]), kf(delay+40,[size*.8,size*.8,100]), {t:delay+60, s:[0,0,100]}]} },
  shapes:[{ty:'gr', nm:'g', it:[
    {ty:'sr', sy:1, d:1, pt:{a:0,k:4}, p:{a:0,k:[0,0]}, r:{a:0,k:0}, ir:{a:0,k:9}, is:{a:0,k:0}, or:{a:0,k:40}, os:{a:0,k:0}, nm:'s'},
    {ty:'fl', c:{a:0,k:col}, o:{a:0,k:100}, r:1, nm:'f'},
    {ty:'tr', p:{a:0,k:[0,0]}, a:{a:0,k:[0,0]}, s:{a:0,k:[100,100]}, r:{a:0,k:0}, o:{a:0,k:100}, sk:{a:0,k:0}, sa:{a:0,k:0}}
  ]}]
});
const sparkleData = { v:'5.7.4', fr:30, ip:0, op:90, w:200, h:200, nm:'sparkle', ddd:0, assets:[],
  layers:[ star(100,95,100,0,[.95,.81,.78,1]), star(150,55,45,18,[.61,.42,1,1]), star(55,145,38,30,[.85,.7,.49,1]) ].map((l,i) => ({...l, ind:i+1})) };
try { lottie.loadAnimation({container:document.getElementById('sparkle'), renderer:'svg', loop:!REDUCED, autoplay:true, animationData:sparkleData}); } catch(e) {}

/* ---------------- Gallery: filters, lightbox, scroll reveal ---------------- */
const gItems = [...document.querySelectorAll('.g-item')];
const gButtons = document.querySelectorAll('.g-filters button');
// show 12 at a time; "Show more" adds the next 12 of the current filter
const PAGE = 12, gMore = document.getElementById('gmore');
let gFilter = 'All', gLimit = PAGE;
function applyGallery(animateFrom = 0){
  const match = gItems.filter(it => gFilter === 'All' || it.dataset.cat === gFilter);
  gItems.forEach(it => it.hidden = true);
  const shown = match.slice(0, gLimit);
  shown.forEach(it => it.hidden = false);
  gMore.parentElement.hidden = match.length <= gLimit;
  gMore.textContent = `Show more photos (${match.length - gLimit} more)`;
  const fresh = shown.slice(animateFrom);
  if (!REDUCED && fresh.length) gsap.fromTo(fresh, {opacity:0, y:24, scale:.97}, {opacity:1, y:0, scale:1, duration:.55, stagger:.04, ease:'power2.out', clearProps:'opacity,transform'});
  ScrollTrigger.refresh();
}
gButtons.forEach(b => b.addEventListener('click', () => {
  gButtons.forEach(x => x.classList.toggle('on', x === b));
  gFilter = b.dataset.f; gLimit = PAGE; applyGallery(0);
}));
gMore.addEventListener('click', () => { const from = gLimit; gLimit += PAGE; applyGallery(from); });
applyGallery(PAGE);   // initial state without the filter animation (the scroll reveal handles it)
const lb = document.getElementById('lightbox'), lbImg = document.getElementById('lb-img'), lbCap = document.getElementById('lb-cap');
let lbIndex = 0;
const visibleItems = () => gItems.filter(it => !it.hidden);
function openLb(i){
  const list = visibleItems(); lbIndex = (i + list.length) % list.length;
  const img = list[lbIndex].querySelector('img');
  lbImg.src = img.src; lbImg.alt = img.alt; lbCap.textContent = img.alt;
  if (!lb.open) lb.showModal();
}
gItems.forEach(it => it.querySelector('button').addEventListener('click', () => openLb(visibleItems().indexOf(it))));
document.getElementById('lb-prev').onclick = () => openLb(lbIndex - 1);
document.getElementById('lb-next').onclick = () => openLb(lbIndex + 1);
document.getElementById('lb-close').onclick = () => lb.close();
lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
lb.addEventListener('keydown', e => { if (e.key === 'ArrowRight') openLb(lbIndex + 1); if (e.key === 'ArrowLeft') openLb(lbIndex - 1); });
if (!REDUCED) {
  // tiles unmask upward in a staggered wave, and their photos drift slightly as you scroll past
  gsap.from(gItems, {clipPath:'inset(100% 0% 0% 0% round 18px)', y:40, duration:1.1, ease:'power3.out', stagger:{each:.08, from:'start'},
    scrollTrigger:{trigger:'#ggrid', start:'top 80%'}, clearProps:'clipPath,transform'});
  gItems.filter(it => !it.classList.contains('chart')).forEach((it, k) => gsap.fromTo(it.querySelector('img'), {yPercent:-4, scale:1.1}, {yPercent:4, scale:1.1, ease:'none',
    scrollTrigger:{trigger:it, start:'top bottom', end:'bottom top', scrub:true}}));
}

/* ---------------- Booking message ---------------- */
const fdate = document.getElementById('fdate');
const d = new Date(); d.setDate(d.getDate()+1); fdate.value = d.toISOString().slice(0,10);
const out = document.getElementById('out'), msg = document.getElementById('msg'), wa = document.getElementById('wa'), copied = document.getElementById('copied');
const val = id => document.getElementById(id).value.trim();
const ferr = document.getElementById('ferr'), sms = document.getElementById('sms');
document.getElementById('bookform').addEventListener('submit', e => {
  e.preventDefault();
  const name = val('fname'), phone = val('fphone');
  const missing = [!name && 'your name', phone.replace(/\D/g, '').length < 9 && 'a phone number we can reach you on', !fdate.value && 'a date'].filter(Boolean);
  if (missing.length) { ferr.textContent = `Please add ${missing.join(' and ')}.`; (document.getElementById(!name ? 'fname' : (!fdate.value && phone.replace(/\D/g,'').length >= 9) ? 'fdate' : 'fphone')).focus(); return; }
  ferr.textContent = '';
  const when = new Date(fdate.value + 'T00:00').toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
  const time = val('ftime') || 'any time';
  const notes = val('fnotes');
  const text = [
    "NEW BOOKING - Equiy's Beauty Studio",
    '',
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Service: ${val('fservice')}`,
    `Date: ${when}`,
    `Time: ${time}`,
    `Where: ${val('fwhere')}`,
    notes ? `Notes: ${notes}` : null,
    '',
    'Sent from the EBS and Plush Hair GH website. Please confirm if this slot is free.'
  ].filter(l => l !== null).join('\n');
  msg.textContent = text; out.hidden = false; copied.textContent = '';
  const waUrl = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  wa.href = waUrl;
  sms.href = `sms:+${WHATSAPP}?&body=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank', 'noopener');
});
document.getElementById('copy').addEventListener('click', () => {
  const sel = () => { const r = document.createRange(); r.selectNodeContents(msg); const s = getSelection(); s.removeAllRanges(); s.addRange(r); copied.textContent = 'Selected. Press copy on your keyboard.'; };
  if (navigator.clipboard) navigator.clipboard.writeText(msg.textContent).then(() => copied.textContent = 'Copied. Paste it into WhatsApp.', sel); else sel();
});