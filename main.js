import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/RGBELoader.js';

// ─── LOADING BAR ─────────────────────────────────────────────────────────────
const loadbar = document.getElementById('loadbar');
const loadStatus = document.getElementById('loading-status');
let loadProgress = 0;

function setLoad(pct, msg) {
  loadProgress = pct;
  loadbar.style.width = pct + '%';
  if (msg) loadStatus.textContent = msg;
}

// ─── PARTICLE SYSTEM ─────────────────────────────────────────────────────────
const pCanvas = document.getElementById('particles');
const pCtx = pCanvas.getContext('2d');
const particles = [];
const PARTICLE_COUNT = 80;

function resizeParticles() {
  pCanvas.width = window.innerWidth;
  pCanvas.height = window.innerHeight;
}
resizeParticles();

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * pCanvas.width;
    this.y = Math.random() * pCanvas.height;
    this.size = Math.random() * 1.5 + 0.3;
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.speedY = -Math.random() * 0.5 - 0.1;
    this.opacity = Math.random() * 0.5 + 0.1;
    this.life = 1;
    this.decay = Math.random() * 0.003 + 0.001;
    this.color = Math.random() > 0.5 ? '0,170,255' : '255,255,255';
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= this.decay;
    if (this.life <= 0) this.reset();
  }
  draw() {
    pCtx.save();
    pCtx.globalAlpha = this.opacity * this.life;
    pCtx.fillStyle = `rgba(${this.color},${this.opacity})`;
    pCtx.shadowColor = `rgba(${this.color},0.8)`;
    pCtx.shadowBlur = 6;
    pCtx.beginPath();
    pCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    pCtx.fill();
    pCtx.restore();
  }
}

for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

function animParticles() {
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animParticles);
}
animParticles();

// ─── THREE.JS SCENE ───────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050508, 0.04);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(5, 2.5, 8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.04;
controls.minDistance = 3;
controls.maxDistance = 16;
controls.maxPolarAngle = Math.PI / 2 + 0.1;
controls.minPolarAngle = 0.2;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.8;
controls.target.set(0, 0.5, 0);

// ─── LIGHTS ──────────────────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);

const keyLight = new THREE.SpotLight(0xffffff, 3, 30, Math.PI / 5, 0.3);
keyLight.position.set(6, 10, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 30;
scene.add(keyLight);

const fillLight = new THREE.SpotLight(0x00aaff, 2, 20, Math.PI / 4, 0.5);
fillLight.position.set(-5, 5, -3);
scene.add(fillLight);

const rimLight = new THREE.SpotLight(0x0055ff, 1.5, 15, Math.PI / 3, 0.5);
rimLight.position.set(0, 3, -8);
scene.add(rimLight);

const groundLight = new THREE.PointLight(0x00aaff, 0.5, 10);
groundLight.position.set(0, -0.5, 0);
scene.add(groundLight);

// ─── FLOOR (SHOWROOM) ────────────────────────────────────────────────────────
const floorGeo = new THREE.PlaneGeometry(40, 40, 50, 50);
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x090912,
  roughness: 0.05,
  metalness: 0.9,
  envMapIntensity: 1.5,
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Floor grid glow
const gridHelper = new THREE.GridHelper(30, 40, 0x00aaff, 0x111130);
gridHelper.position.y = 0.01;
gridHelper.material.opacity = 0.25;
gridHelper.material.transparent = true;
scene.add(gridHelper);

// ─── RING LIGHT DECORATION ───────────────────────────────────────────────────
function makeRingLight(radius, color, y) {
  const geo = new THREE.TorusGeometry(radius, 0.03, 8, 80);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = y;
  scene.add(mesh);
  return mesh;
}
const ring1 = makeRingLight(3.5, 0x00aaff, 0.02);
const ring2 = makeRingLight(4.5, 0x0044aa, 0.01);
const ring3 = makeRingLight(5.5, 0x002255, 0.005);

// ─── BUILD PROCEDURAL BMW M4 CAR ─────────────────────────────────────────────
let carPaintMaterial;
let carGroup;
let currentColor = 0x1a1a2e;

function buildCar(bodyColor = 0x1a1a2e) {
  if (carGroup) {
    scene.remove(carGroup);
    carGroup.traverse(c => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    });
  }

  carGroup = new THREE.Group();

  // Materials
  carPaintMaterial = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.2,
    metalness: 0.9,
    envMapIntensity: 1.5,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x111122,
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity: 0.6,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.05,
    metalness: 1.0,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
    metalness: 0.0,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.1,
    metalness: 1.0,
  });

  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.8,
  });

  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0xff2200,
    emissive: 0xff2200,
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 0.9,
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a, roughness: 0.8, metalness: 0.1,
  });

  // ── MAIN BODY ──
  const bodyGeo = new THREE.BoxGeometry(4.4, 0.6, 2.0);
  const body = new THREE.Mesh(bodyGeo, carPaintMaterial);
  body.position.set(0, 0.55, 0);
  body.castShadow = true;
  carGroup.add(body);

  // ── LOWER BODY SILL ──
  const sillGeo = new THREE.BoxGeometry(4.6, 0.25, 2.1);
  const sill = new THREE.Mesh(sillGeo, carPaintMaterial);
  sill.position.set(0, 0.27, 0);
  sill.castShadow = true;
  carGroup.add(sill);

  // ── CABIN / ROOF ──
  const cabinGeo = new THREE.BoxGeometry(2.1, 0.7, 1.85);
  const cabin = new THREE.Mesh(cabinGeo, carPaintMaterial);
  cabin.position.set(-0.1, 1.15, 0);
  cabin.castShadow = true;

  // Taper roof (scale vertices)
  const pos = cabin.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y > 0) {
      pos.setX(i, pos.getX(i) * 0.85);
      pos.setZ(i, pos.getZ(i) * 0.92);
    }
  }
  pos.needsUpdate = true;
  carGroup.add(cabin);

  // ── WINDSHIELD FRONT ──
  const wfGeo = new THREE.BoxGeometry(0.05, 0.62, 1.7);
  const windFront = new THREE.Mesh(wfGeo, glassMat);
  windFront.position.set(0.92, 1.12, 0);
  windFront.rotation.z = -0.4;
  carGroup.add(windFront);

  // ── WINDSHIELD REAR ──
  const wrGeo = new THREE.BoxGeometry(0.05, 0.55, 1.7);
  const windRear = new THREE.Mesh(wrGeo, glassMat);
  windRear.position.set(-1.08, 1.1, 0);
  windRear.rotation.z = 0.5;
  carGroup.add(windRear);

  // ── SIDE WINDOWS ──
  for (const side of [-1, 1]) {
    const swGeo = new THREE.BoxGeometry(1.8, 0.5, 0.05);
    const sw = new THREE.Mesh(swGeo, glassMat);
    sw.position.set(-0.05, 1.1, side * 0.95);
    carGroup.add(sw);
  }

  // ── HOOD ──
  const hoodGeo = new THREE.BoxGeometry(1.5, 0.08, 1.95);
  const hood = new THREE.Mesh(hoodGeo, carPaintMaterial);
  hood.position.set(1.62, 0.87, 0);
  hood.rotation.z = -0.04;
  hood.castShadow = true;
  carGroup.add(hood);

  // ── TRUNK ──
  const trunkGeo = new THREE.BoxGeometry(1.0, 0.08, 1.95);
  const trunk = new THREE.Mesh(trunkGeo, carPaintMaterial);
  trunk.position.set(-1.78, 0.87, 0);
  trunk.rotation.z = 0.06;
  trunk.castShadow = true;
  carGroup.add(trunk);

  // ── FRONT BUMPER / SPLITTER ──
  const bumperGeo = new THREE.BoxGeometry(0.25, 0.45, 2.0);
  const bumper = new THREE.Mesh(bumperGeo, carPaintMaterial);
  bumper.position.set(2.33, 0.37, 0);
  bumper.castShadow = true;
  carGroup.add(bumper);

  // Splitter
  const splitterGeo = new THREE.BoxGeometry(0.4, 0.06, 2.05);
  const splitter = new THREE.Mesh(splitterGeo, blackMat);
  splitter.position.set(2.35, 0.15, 0);
  carGroup.add(splitter);

  // ── REAR BUMPER ──
  const rearGeo = new THREE.BoxGeometry(0.25, 0.45, 2.0);
  const rearBumper = new THREE.Mesh(rearGeo, carPaintMaterial);
  rearBumper.position.set(-2.33, 0.37, 0);
  rearBumper.castShadow = true;
  carGroup.add(rearBumper);

  // ── FRONT GRILLE (BMW Kidney) ──
  for (const side of [-0.45, 0.45]) {
    const gGeo = new THREE.BoxGeometry(0.12, 0.3, 0.38);
    const grille = new THREE.Mesh(gGeo, blackMat);
    grille.position.set(2.42, 0.52, side);
    carGroup.add(grille);

    // Grille frame
    const gfGeo = new THREE.BoxGeometry(0.1, 0.33, 0.41);
    const gframe = new THREE.Mesh(gfGeo, chromeMat);
    gframe.position.set(2.41, 0.52, side);
    carGroup.add(gframe);
  }

  // ── HEADLIGHTS (front) ──
  for (const side of [-0.8, 0.8]) {
    const hlGeo = new THREE.BoxGeometry(0.1, 0.15, 0.55);
    const hl = new THREE.Mesh(hlGeo, lightMat);
    hl.position.set(2.4, 0.6, side);
    carGroup.add(hl);

    // DRL strip
    const drlGeo = new THREE.BoxGeometry(0.08, 0.05, 0.55);
    const drl = new THREE.Mesh(drlGeo, lightMat);
    drl.position.set(2.42, 0.72, side);
    carGroup.add(drl);

    // Point light
    const hLight = new THREE.PointLight(0xffffff, 0.3, 4);
    hLight.position.set(2.6, 0.65, side);
    carGroup.add(hLight);
  }

  // ── TAILLIGHTS ──
  for (const side of [-0.7, 0.7]) {
    const tlGeo = new THREE.BoxGeometry(0.08, 0.18, 0.55);
    const tl = new THREE.Mesh(tlGeo, tailLightMat);
    tl.position.set(-2.4, 0.63, side);
    carGroup.add(tl);

    // Point light
    const tLight = new THREE.PointLight(0xff2200, 0.2, 3);
    tLight.position.set(-2.55, 0.65, side);
    carGroup.add(tLight);
  }

  // ── EXHAUST TIPS ──
  for (const side of [-0.55, -0.25, 0.25, 0.55]) {
    const exGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 12);
    const ex = new THREE.Mesh(exGeo, chromeMat);
    ex.position.set(-2.46, 0.18, side);
    ex.rotation.z = Math.PI / 2;
    carGroup.add(ex);
  }

  // ── SIDE MIRRORS ──
  for (const side of [-1, 1]) {
    const mirGeo = new THREE.BoxGeometry(0.2, 0.12, 0.08);
    const mir = new THREE.Mesh(mirGeo, carPaintMaterial);
    mir.position.set(0.9, 1.02, side * 1.0);
    carGroup.add(mir);
  }

  // ── ROOF SPOILER ──
  const spoilerGeo = new THREE.BoxGeometry(0.8, 0.1, 1.85);
  const spoiler = new THREE.Mesh(spoilerGeo, carPaintMaterial);
  spoiler.position.set(-1.1, 1.52, 0);
  spoiler.rotation.z = 0.1;
  carGroup.add(spoiler);

  // ── WHEELS ──
  function addWheel(x, z) {
    const wGroup = new THREE.Group();

    // Tire
    const tireGeo = new THREE.TorusGeometry(0.42, 0.16, 16, 40);
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.y = Math.PI / 2;
    wGroup.add(tire);

    // Rim disc
    const rimDiscGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.05, 20);
    const rimDisc = new THREE.Mesh(rimDiscGeo, rimMat);
    rimDisc.rotation.z = Math.PI / 2;
    wGroup.add(rimDisc);

    // Spokes (5-spoke M-style)
    for (let i = 0; i < 5; i++) {
      const spokeGeo = new THREE.BoxGeometry(0.5, 0.04, 0.06);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.rotation.z = Math.PI / 2;
      spoke.rotation.x = (i / 5) * Math.PI * 2;
      const angle = (i / 5) * Math.PI * 2;
      spoke.position.set(0.02, Math.sin(angle) * 0.14, Math.cos(angle) * 0.14);
      wGroup.add(spoke);
    }

    // Center cap
    const capGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.07, 12);
    const cap = new THREE.Mesh(capGeo, chromeMat);
    cap.rotation.z = Math.PI / 2;
    wGroup.add(cap);

    // Brake disc (visible behind rim)
    const discGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.04, 20);
    const disc = new THREE.Mesh(discGeo, new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.8 }));
    disc.rotation.z = Math.PI / 2;
    disc.position.x = -0.04;
    wGroup.add(disc);

    wGroup.position.set(x, 0.43, z);
    wGroup.castShadow = true;
    carGroup.add(wGroup);
    return wGroup;
  }

  const wheels = [
    addWheel( 1.55,  1.0),
    addWheel( 1.55, -1.0),
    addWheel(-1.55,  1.0),
    addWheel(-1.55, -1.0),
  ];

  // Wheel animation reference
  carGroup.userData.wheels = wheels;

  scene.add(carGroup);
  return carGroup;
}

// ─── BUILD INITIAL CAR ───────────────────────────────────────────────────────
setLoad(30, 'Building 3D model...');
buildCar(currentColor);
setLoad(60, 'Setting up environment...');

// ─── ENVIRONMENT MAP ─────────────────────────────────────────────────────────
// Use a simple procedural environment
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Create a simple gradient env
const envScene = new THREE.Scene();
envScene.background = new THREE.Color(0x0a0a14);
const envTex = pmremGenerator.fromScene(new THREE.RoomEnvironment()).texture;
scene.environment = envTex;
scene.background = new THREE.Color(0x050508);

// Try to load HDRI from Poly Haven
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr',
  (hdr) => {
    const envMap = pmremGenerator.fromEquirectangular(hdr).texture;
    scene.environment = envMap;
    hdr.dispose();
    pmremGenerator.dispose();
  },
  undefined,
  () => { /* fallback already set above */ }
);

setLoad(80, 'Polishing paint...');

// ─── SPINNING CAR ────────────────────────────────────────────────────────────
let isSpinning = false;
let spinAngle = 0;

window.spinCar = function () {
  if (isSpinning) return;
  isSpinning = true;
  controls.autoRotate = false;
  spinAngle = 0;
};

// ─── COLOR CHANGE ─────────────────────────────────────────────────────────────
const colorNames = {
  '#1a1a2e': 'Sapphire Black',
  '#c0392b': 'M Red',
  '#2980b9': 'Laguna Blue',
  '#e8e8e0': 'Alpine White',
  '#2c2c2c': 'Carbon Black',
  '#4a7c59': 'Isle of Man Green',
  '#e67e22': 'Fire Orange',
  '#8e44ad': 'Violet',
};

window.changeColor = function (el) {
  const hex = el.dataset.color;
  applyColor(hex);
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('colorName').textContent = colorNames[hex] || hex;
};

window.changeColorByHex = function (hex, name) {
  applyColor(hex);
  document.getElementById('colorName').textContent = name;
  // Update swatch highlights
  document.querySelectorAll('.swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === hex);
  });
};

function applyColor(hex) {
  currentColor = parseInt(hex.replace('#', '0x'));
  if (!carGroup) return;
  carGroup.traverse(child => {
    if (child.isMesh && child.material === carPaintMaterial) {
      // no-op if already ref
    }
  });
  // Rebuild car with new color
  const newColor = parseInt(hex.replace('#', ''), 16);
  buildCar(newColor);
}

// ─── PANEL SYSTEM ─────────────────────────────────────────────────────────────
window.showPanel = function (id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('open'));
  document.getElementById('panelOverlay').classList.add('active');
  document.getElementById('panel-' + id).classList.add('open');
  controls.autoRotate = false;
};

window.closePanel = function () {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('open'));
  document.getElementById('panelOverlay').classList.remove('active');
  controls.autoRotate = true;
};

// ─── FINISH LOADING ───────────────────────────────────────────────────────────
setTimeout(() => {
  setLoad(100, 'Ready!');
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
    document.querySelector('.top-bar').classList.add('visible');
    document.querySelector('.hero').classList.add('visible');
    document.querySelector('.color-picker').classList.add('visible');
    document.querySelector('.side-stats').classList.add('visible');
    document.querySelector('.bottom-hint').classList.add('visible');
    controls.autoRotate = true;
  }, 500);
}, 1200);

// ─── ANIMATION LOOP ───────────────────────────────────────────────────────────
const clock = new THREE.Clock();

(function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  controls.update();

  // Ring pulse
  if (ring1) {
    ring1.material.opacity = 0.2 + Math.sin(elapsed * 1.5) * 0.2;
    ring2.material.opacity = 0.1 + Math.sin(elapsed * 1.5 + 1) * 0.15;
    ring3.material.opacity = 0.05 + Math.sin(elapsed * 1.5 + 2) * 0.05;
  }

  // Spin car 360°
  if (isSpinning && carGroup) {
    carGroup.rotation.y += delta * 3;
    spinAngle += delta * 3;
    if (spinAngle >= Math.PI * 2) {
      carGroup.rotation.y = 0;
      isSpinning = false;
      controls.autoRotate = true;
    }
  }

  // Spin wheels during auto-rotate
  if (carGroup && carGroup.userData.wheels) {
    const wheelSpeed = controls.autoRotate ? delta * 2 : 0;
    carGroup.userData.wheels.forEach(w => {
      if (w.children[0]) w.children[0].rotation.x += wheelSpeed;
    });
  }

  // Gentle car float
  if (carGroup && !isSpinning) {
    carGroup.position.y = Math.sin(elapsed * 0.8) * 0.04;
  }

  // Animate lights
  if (groundLight) {
    groundLight.intensity = 0.3 + Math.sin(elapsed * 2) * 0.2;
    groundLight.color.setHSL(0.55 + Math.sin(elapsed * 0.3) * 0.05, 1, 0.5);
  }

  renderer.render(scene, camera);
})();

// ─── RESIZE ──────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  resizeParticles();
});

// ─── KEYBOARD CONTROLS ────────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') window.spinCar();
  if (e.key === 'Escape') window.closePanel();
});

// ─── HOVER HIDE HINT ─────────────────────────────────────────────────────────
let hintTimer;
canvas.addEventListener('pointerdown', () => {
  document.querySelector('.bottom-hint').style.opacity = '0';
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => {
    document.querySelector('.bottom-hint').style.opacity = '1';
  }, 3000);
});
