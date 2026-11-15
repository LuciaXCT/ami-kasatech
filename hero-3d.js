import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function initHero3D() {
  const canvas = document.getElementById('heroCanvas3D');
  if (!canvas) return;

  const PAPER = 0xFFF7F4, CREAM = 0xFFFDF9, INK = 0x151112, ROSE = 0xD88E9A, PEACH = 0xF6D9CA, ROSEDEEP = 0x965765;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    console.warn('WebGL not supported, falling back to 2D illustration', e);
    const fallback = document.getElementById('svgFallback');
    if (fallback) fallback.style.display = 'block';
    if (canvas) canvas.style.display = 'none';
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(PAPER, 12, 24);

  const rect = canvas.getBoundingClientRect();
  const aspect = (rect.width && rect.height) ? (rect.width / rect.height) : 1;
  const cam = new THREE.PerspectiveCamera(34, aspect, 0.1, 60);
  cam.position.set(2.7, 2.1, 3.6);

  // Studio Lighting
  scene.add(new THREE.HemisphereLight(0xFFFDF9, PEACH, 0.95));
  
  const keyLight = new THREE.DirectionalLight(0xFFF1E6, 1.25);
  keyLight.position.set(3.5, 6, 3);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.0004;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xF6E4E3, 0.45);
  fillLight.position.set(-4, 2.5, -2);
  scene.add(fillLight);

  // Soft Ground Shadow
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(6, 48),
    new THREE.ShadowMaterial({ opacity: 0.14 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  // Textures for box labels
  function createTextTexture(text, { w = 1024, h = 160, size = 52, color = '#965765', ls = 8 } = {}) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = color;
    ctx.font = `600 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = ls + 'px';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 2);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function createMarkTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 640;
    const ctx = c.getContext('2d');
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(62, 51, 52, 0.22)';
    ctx.beginPath();
    ctx.ellipse(256, 320, 172, 238, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(21, 17, 18, 0.22)';
    ctx.beginPath();
    ctx.ellipse(256, 300, 128, 74, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 253, 249, 0.95)';
    ctx.beginPath();
    ctx.ellipse(208, 300, 26, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(304, 300, 26, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  // --- 1. BUILD THE 3D ROBOT ---
  function buildRobot() {
    const g = new THREE.Group();
    g.userData.parts = {};
    const P = g.userData.parts;
    const reg = (id) => (ms) => {
      ms.forEach(m => { m.userData.part = id; });
      P[id] = (P[id] || []).concat(ms);
    };

    // Continuous Ovoid Body (Soft Matte Cream)
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 64),
      new THREE.MeshPhysicalMaterial({
        color: CREAM,
        roughness: 0.36,
        clearcoat: 0.32,
        clearcoatRoughness: 0.55
      })
    );
    body.scale.set(1.05, 1.38, 0.92);
    body.position.y = 1.45;
    body.castShadow = true;
    reg('shell')([body]);
    g.add(body);

    // Glossy Black Curved Visor
    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 32),
      new THREE.MeshPhysicalMaterial({
        color: INK,
        roughness: 0.12,
        clearcoat: 1.0,
        clearcoatRoughness: 0.2
      })
    );
    visor.scale.set(0.66, 0.40, 0.50);
    visor.position.set(0, 1.78, 0.72);
    visor.castShadow = true;
    reg('visor')([visor]);
    g.add(visor);

    // Glowing Cyan / Cream Capsule Eyes
    const eyeMat = new THREE.MeshStandardMaterial({
      color: CREAM,
      emissive: CREAM,
      emissiveIntensity: 1.7,
      roughness: 0.3
    });
    const eyes = [];
    [-1, 1].forEach((s) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 24), eyeMat);
      eye.scale.set(0.085, 0.165, 0.055);
      eye.position.set(0.24 * s, 1.78, 1.20);
      eyes.push(eye);
      g.add(eye);
    });
    reg('eyes')(eyes);
    g.userData.eyes = eyes;

    // Breathing Rose Heart Ring (2mm base seam)
    const ringMat = new THREE.MeshStandardMaterial({
      color: ROSE,
      emissive: ROSE,
      emissiveIntensity: 0.85,
      roughness: 0.4
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.40, 0.05, 16, 48), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.16, 0.1);
    reg('ring')([ring]);
    g.add(ring);
    g.userData.ringMat = ringMat;

    // Speaker Holes on Rear
    const spk = [];
    for (let i = -2; i <= 2; i++) {
      const hole = new THREE.Mesh(
        new THREE.CircleGeometry(0.042, 16),
        new THREE.MeshStandardMaterial({ color: 0x3A3031, roughness: 0.8 })
      );
      hole.position.set(i * 0.085, 0.006 - Math.abs(i) * 0.004, -0.005);
      hole.rotation.y = Math.PI;
      spk.push(hole);
    }
    const speaker = new THREE.Group();
    speaker.position.set(0, 2.0, -0.83);
    speaker.rotation.x = -0.12;
    spk.forEach(h => speaker.add(h));
    reg('speaker')(spk);
    g.add(speaker);

    // USB-C Charge Port
    const charge = new THREE.Group();
    const port = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.048, 0.14, 20),
      new THREE.MeshStandardMaterial({ color: 0x3A3031, roughness: 0.35, metalness: 0.6 })
    );
    port.rotation.z = Math.PI / 2;
    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.014, 0.012),
      new THREE.MeshStandardMaterial({ color: 0x514344, roughness: 0.4 })
    );
    slot.position.z = -0.012;
    charge.add(port, slot);
    charge.position.set(0, 0.35, -0.565);
    charge.rotation.x = -0.1;
    reg('charge')([port, slot]);
    g.add(charge);

    // MicroSD Slot
    const sd = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.035, 0.022),
      new THREE.MeshStandardMaterial({ color: 0x3A3031, roughness: 0.4 })
    );
    sd.position.set(0.30, 0.35, -0.49);
    sd.rotation.y = 0.55;
    reg('music')([sd]);
    g.add(sd);

    // Capacitive Power Button
    const power = new THREE.Group();
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.02, 24),
      new THREE.MeshStandardMaterial({ color: 0x3A3334, roughness: 0.5 })
    );
    cap.rotation.x = Math.PI / 2;
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.055, 0.011, 12, 32),
      new THREE.MeshStandardMaterial({ color: ROSEDEEP, roughness: 0.5 })
    );
    power.add(cap, halo);
    power.position.set(0, 2.55, -0.55);
    power.rotation.x = -0.35;
    reg('power')([cap, halo]);
    g.add(power);

    return g;
  }

  const robotG = buildRobot();
  scene.add(robotG);

  const hitList = [];
  robotG.traverse(o => { if (o.isMesh && o.userData.part) hitList.push(o); });

  // --- 2. BUILD THE 3D UNBOXING BOX ---
  const boxG = new THREE.Group();
  {
    const boxMat = new THREE.MeshPhysicalMaterial({ color: CREAM, roughness: 0.55, side: THREE.DoubleSide });

    // Base Box
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.78, 1.35), boxMat);
    base.position.y = 0.39;
    base.castShadow = true;
    base.userData.part = 'packinfo';
    hitList.push(base);
    boxG.add(base);

    // Base Label
    const baseLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.13),
      new THREE.MeshBasicMaterial({
        map: createTextTexture('SN 0000-AMI-0001 · USB-C · 5 V, 2 A', { h: 96, size: 40, color: '#837273', ls: 4 }),
        transparent: true
      })
    );
    baseLabel.position.set(0, 0.09, 0.677);
    boxG.add(baseLabel);

    // Telescoping Lid
    const lid = new THREE.Mesh(new THREE.BoxGeometry(2.51, 0.50, 1.41), boxMat);
    lid.position.set(0, 1.03, 0);
    lid.castShadow = true;
    lid.userData.part = 'packlabel';
    hitList.push(lid);

    const emboss = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 1.12),
      new THREE.MeshBasicMaterial({ map: createMarkTexture(), transparent: true })
    );
    emboss.rotation.x = -Math.PI / 2;
    emboss.position.y = 0.252;
    lid.add(emboss);
    boxG.add(lid);

    // Paper Band
    const bandMat = new THREE.MeshStandardMaterial({ color: 0xF6E4E3, roughness: 0.6, side: THREE.DoubleSide, transparent: true });
    const band = new THREE.Mesh(new THREE.BoxGeometry(2.47, 0.40, 1.37), bandMat);
    band.position.y = 0.42;
    band.castShadow = true;

    const bandLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 0.24),
      new THREE.MeshBasicMaterial({
        map: createTextTexture('AMI · A SMALL FRIEND FOR BIG DAYS', { w: 1024, h: 120, size: 46, ls: 6 }),
        transparent: true
      })
    );
    bandLabel.position.set(0, 0, 0.688);
    band.add(bandLabel);
    boxG.add(band);

    // Mini companion inside pulp tray
    const mini = buildRobot();
    mini.scale.setScalar(0.34);
    mini.position.y = -0.45;
    mini.traverse(o => { o.castShadow = false; });
    boxG.add(mini);

    boxG.userData = { lid, band, mini, isOpen: false };
  }
  boxG.visible = false;
  scene.add(boxG);

  // --- 3. ORBIT CONTROLS & CAMERA ---
  const controls = new OrbitControls(cam, canvas);
  controls.target.set(0, 1.4, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 2.2;
  controls.maxDistance = 8;
  controls.maxPolarAngle = 1.54;
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 0.8;
  controls.addEventListener('start', () => { setSpinState(false); });

  const btnToggleSpin = document.getElementById('btnToggleSpin');
  function setSpinState(on) {
    controls.autoRotate = on;
    if (btnToggleSpin) {
      btnToggleSpin.textContent = `Spin: ${on ? 'on' : 'off'}`;
      btnToggleSpin.classList.toggle('active', on);
    }
  }
  btnToggleSpin?.addEventListener('click', () => setSpinState(!controls.autoRotate));

  // Camera Preset Views
  const VIEWS = {
    front: { p: [0, 1.5, 4.6], t: [0, 1.5, 0] },
    threeq: { p: [2.7, 2.1, 3.6], t: [0, 1.4, 0] },
    top: { p: [0, 5.2, 2.2], t: [0, 1.2, 0] },
    box: { p: [2.9, 2.2, 4.2], t: [0, 0.7, 0] }
  };

  let camTween = null;
  function flyCamera(targetPos, targetLook, duration = 650) {
    camTween = {
      t0: performance.now(),
      duration,
      p0: cam.position.clone(),
      p1: new THREE.Vector3(...targetPos),
      g0: controls.target.clone(),
      g1: new THREE.Vector3(...targetLook)
    };
  }

  const viewChips = document.querySelectorAll('.view-chip[data-v]');
  viewChips.forEach(chip => {
    chip.addEventListener('click', () => {
      viewChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const v = VIEWS[chip.dataset.v];
      if (v) flyCamera(v.p, v.t);
    });
  });

  // Mode Switcher: Robot 3D vs Box 3D
  const btnModeRobot = document.getElementById('btnModeRobot');
  const btnModeBox = document.getElementById('btnModeBox');
  const hintText = document.getElementById('hintText');
  let currentMode = 'robot';

  function set3DMode(mode) {
    currentMode = mode;
    if (mode === 'robot') {
      robotG.visible = true;
      boxG.visible = false;
      btnModeRobot?.classList.add('active');
      btnModeBox?.classList.remove('active');
      flyCamera(VIEWS.threeq.p, VIEWS.threeq.t);
      if (hintText) hintText.textContent = 'drag to rotate · tap any part of the robot';
    } else {
      robotG.visible = false;
      boxG.visible = true;
      btnModeBox?.classList.add('active');
      btnModeRobot?.classList.remove('active');
      flyCamera(VIEWS.box.p, VIEWS.box.t);
      if (hintText) hintText.textContent = 'tap box to open/close unboxing lid';
    }
  }

  btnModeRobot?.addEventListener('click', () => set3DMode('robot'));
  btnModeBox?.addEventListener('click', () => set3DMode('box'));

  // Box Open / Close Animation
  function toggleBoxOpen() {
    if (!boxG.userData) return;
    const { lid, band, mini, isOpen } = boxG.userData;
    boxG.userData.isOpen = !isOpen;

    const targetLidY = !isOpen ? 2.3 : 1.03;
    const targetBandAlpha = !isOpen ? 0.0 : 1.0;
    const targetMiniY = !isOpen ? 0.35 : -0.45;

    const startLidY = lid.position.y;
    const startBandAlpha = band.material.opacity;
    const startMiniY = mini.position.y;
    const t0 = performance.now();
    const dur = 750;

    function animLid() {
      const elapsed = performance.now() - t0;
      const progress = Math.min(1, elapsed / dur);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      lid.position.y = startLidY + (targetLidY - startLidY) * ease;
      band.material.opacity = startBandAlpha + (targetBandAlpha - startBandAlpha) * ease;
      mini.position.y = startMiniY + (targetMiniY - startMiniY) * ease;

      if (progress < 1) {
        requestAnimationFrame(animLid);
      }
    }
    animLid();
  }

  // --- 4. RAYCASTING & PART INSPECTION ---
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const amiCaptionText = document.getElementById('amiCaptionText');

  const PART_DETAILS = {
    visor: "Visor & Eyes · Dark curved glass visor with two glowing capsule eyes. Spans 60% of front height.",
    ring: "Breathing Heart Ring · Soft rose ring along the 3mm base seam. Breathes on a 2.2s pace.",
    power: "Capacitive Power Button · Single top crown control. Hold to start/end a session.",
    speaker: "Speaker Arc · 5 micro-perforations on the rear. Plays royalty-free audio locally from microSD.",
    charge: "USB-C Port · Centered low on the rear to keep desk cables neat and hidden.",
    music: "MicroSD Slot · Recessed into lower base. Holds 32GB preloaded soundscapes.",
    shell: "Matte Shell · Soft-touch unibody with 3mm shadow gap. No visible screws.",
    packinfo: "Unboxing Box · Rigid paper wrap with molded unbleached pulp tray. Zero plastic.",
    packlabel: "Hot-Stamped Foil · Rose-deep foil stamping and blind-embossed face mark on lid."
  };

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, cam);
    const intersects = raycaster.intersectObjects(hitList, true);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const partKey = hit.userData.part;

      if (currentMode === 'box') {
        toggleBoxOpen();
      }

      if (partKey && PART_DETAILS[partKey]) {
        if (amiCaptionText) amiCaptionText.textContent = PART_DETAILS[partKey];

        // Trigger pulse glow on hit part
        if (hit.material && hit.material.emissive) {
          const origIntensity = hit.material.emissiveIntensity || 1;
          hit.material.emissiveIntensity = origIntensity * 2.5;
          setTimeout(() => { hit.material.emissiveIntensity = origIntensity; }, 300);
        }
      }
    }
  });

  // Resize Handler
  function onResize() {
    const r = canvas.getBoundingClientRect();
    if (r.width && r.height) {
      cam.aspect = r.width / r.height;
      cam.updateProjectionMatrix();
      renderer.setSize(r.width, r.height, false);
    }
  }
  window.addEventListener('resize', onResize);
  onResize();

  // 3D Eye Blink Animation
  let is3DBlinking = false;
  function trigger3DBlink() {
    if (is3DBlinking || !robotG.userData.eyes) return;
    is3DBlinking = true;
    const eyes = robotG.userData.eyes;
    const t0 = performance.now();
    const dur = 200;
    function animBlink() {
      const elapsed = performance.now() - t0;
      const p = Math.min(1, elapsed / dur);
      const sY = p < 0.5
        ? 0.165 * (1 - (p / 0.5) * 0.92)
        : 0.165 * (0.08 + ((p - 0.5) / 0.5) * 0.92);
      eyes.forEach(e => { e.scale.y = Math.max(0.012, sY); });
      if (p < 1) {
        requestAnimationFrame(animBlink);
      } else {
        eyes.forEach(e => { e.scale.y = 0.165; });
        is3DBlinking = false;
      }
    }
    animBlink();
  }

  // Periodic Idle Blink every 4-6s
  setInterval(() => {
    if (Math.random() > 0.35 && !is3DBlinking && robotG.visible) {
      trigger3DBlink();
    }
  }, 4500);

  document.getElementById('btnRobotBlink')?.addEventListener('click', trigger3DBlink);

  // --- 5. RENDER & ANIMATION LOOP ---
  let t = 0;
  function animateFrame() {
    requestAnimationFrame(animateFrame);
    t += 0.02;

    // Heart Ring Breathing
    if (robotG.userData.ringMat) {
      robotG.userData.ringMat.emissiveIntensity = 0.7 + 0.3 * Math.sin(t * 1.8);
    }

    // Camera Fly-To Tweening
    if (camTween) {
      const elapsed = performance.now() - camTween.t0;
      const p = Math.min(1, elapsed / camTween.duration);
      const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

      cam.position.lerpVectors(camTween.p0, camTween.p1, ease);
      controls.target.lerpVectors(camTween.g0, camTween.g1, ease);

      if (p >= 1) camTween = null;
    }

    controls.update();
    renderer.render(scene, cam);
  }
  animateFrame();
}
