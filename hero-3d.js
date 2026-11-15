import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function initHero3D() {
  const canvas = document.getElementById('heroCanvas3D');
  if (!canvas) return;

  const PAPER = 0xFFF7F4, CREAM = 0xFFFDF9, INK = 0x151112, ROSE = 0xD88E9A, PEACH = 0xF6D9CA, ROSEDEEP = 0x965765, BLUE = 0x5BA4E6;
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

    ctx.fillStyle = 'rgba(91, 164, 230, 0.95)';
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
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: CREAM,
      roughness: 0.36,
      clearcoat: 0.32,
      clearcoatRoughness: 0.55
    });
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 64),
      bodyMat
    );
    body.scale.set(1.05, 1.38, 0.92);
    body.position.y = 1.45;
    body.castShadow = true;
    reg('shell')([body]);
    g.add(body);

    // Cute Rounded Bear Ears on Top Corners of Head
    [-1, 1].forEach((s) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 24), bodyMat);
      ear.scale.set(0.95, 1.05, 0.75);
      ear.position.set(0.68 * s, 2.56, 0.02);
      ear.rotation.z = -0.32 * s;
      ear.rotation.y = 0.10 * s;
      ear.castShadow = true;
      reg('ears')([ear]);
      g.add(ear);
    });

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

    // Dynamic 3-Emotion High-Res Canvas Texture for Eyes (^ ^ / > < / - -)
    const eyeCanvas = document.createElement('canvas');
    eyeCanvas.width = 512;
    eyeCanvas.height = 256;
    const eyeCtx = eyeCanvas.getContext('2d');
    const eyeTexture = new THREE.CanvasTexture(eyeCanvas);
    eyeTexture.colorSpace = THREE.SRGBColorSpace;

    function renderEyes(emotion = 'happy', blinkScale = 1.0) {
      eyeCtx.clearRect(0, 0, 512, 256);
      eyeCtx.save();
      eyeCtx.strokeStyle = '#5BA4E6';
      eyeCtx.fillStyle = '#5BA4E6';
      eyeCtx.shadowColor = '#38BDF8';
      eyeCtx.shadowBlur = 18;
      eyeCtx.lineCap = 'round';
      eyeCtx.lineJoin = 'round';

      const cx1 = 175;
      const cx2 = 337;
      const cy = 128;

      if (blinkScale < 0.12) {
        eyeCtx.lineWidth = 6;
        [-1, 1].forEach((s) => {
          const x = s === -1 ? cx1 : cx2;
          eyeCtx.beginPath();
          eyeCtx.moveTo(x - 36, cy);
          eyeCtx.lineTo(x + 36, cy);
          eyeCtx.stroke();
        });
        eyeCtx.restore();
        eyeTexture.needsUpdate = true;
        return;
      }

      if (emotion === 'happy') {
        // Happy = ^ ^ (smiling curved upward neon arcs)
        eyeCtx.lineWidth = 14;
        [-1, 1].forEach((s) => {
          const x = s === -1 ? cx1 : cx2;
          eyeCtx.beginPath();
          eyeCtx.arc(x, cy + 22, 38, Math.PI * 1.15, Math.PI * 1.85);
          eyeCtx.stroke();
          eyeCtx.save();
          eyeCtx.strokeStyle = '#E0F2FE';
          eyeCtx.lineWidth = 5;
          eyeCtx.beginPath();
          eyeCtx.arc(x, cy + 22, 38, Math.PI * 1.20, Math.PI * 1.80);
          eyeCtx.stroke();
          eyeCtx.restore();
        });
      } else if (emotion === 'silly') {
        // Silly = > < (playful angled chevrons)
        eyeCtx.lineWidth = 14;
        eyeCtx.beginPath();
        eyeCtx.moveTo(cx1 - 26, cy - 26 * blinkScale);
        eyeCtx.lineTo(cx1 + 22, cy);
        eyeCtx.lineTo(cx1 - 26, cy + 26 * blinkScale);
        eyeCtx.stroke();

        eyeCtx.beginPath();
        eyeCtx.moveTo(cx2 + 26, cy - 26 * blinkScale);
        eyeCtx.lineTo(cx2 - 22, cy);
        eyeCtx.lineTo(cx2 + 26, cy + 26 * blinkScale);
        eyeCtx.stroke();

        eyeCtx.save();
        eyeCtx.strokeStyle = '#E0F2FE';
        eyeCtx.lineWidth = 5;
        eyeCtx.beginPath();
        eyeCtx.moveTo(cx1 - 26, cy - 26 * blinkScale);
        eyeCtx.lineTo(cx1 + 22, cy);
        eyeCtx.lineTo(cx1 - 26, cy + 26 * blinkScale);
        eyeCtx.stroke();
        eyeCtx.beginPath();
        eyeCtx.moveTo(cx2 + 26, cy - 26 * blinkScale);
        eyeCtx.lineTo(cx2 - 22, cy);
        eyeCtx.lineTo(cx2 + 26, cy + 26 * blinkScale);
        eyeCtx.stroke();
        eyeCtx.restore();
      } else {
        // Neutral = - - (sleek horizontal capsule slit eyes)
        const w = 70;
        const h = 24 * blinkScale;
        [-1, 1].forEach((s) => {
          const x = s === -1 ? cx1 : cx2;
          eyeCtx.beginPath();
          eyeCtx.roundRect(x - w / 2, cy - h / 2, w, Math.max(4, h), 12);
          eyeCtx.fill();
          eyeCtx.save();
          eyeCtx.fillStyle = '#E0F2FE';
          eyeCtx.beginPath();
          eyeCtx.roundRect(x - w / 2 + 8, cy - (h * 0.45) / 2, w - 16, Math.max(2, h * 0.45), 6);
          eyeCtx.fill();
          eyeCtx.restore();
        });
      }

      eyeCtx.restore();
      eyeTexture.needsUpdate = true;
    }

    renderEyes('happy', 1.0);

    const eyePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.78, 0.39),
      new THREE.MeshBasicMaterial({
        map: eyeTexture,
        transparent: true,
        opacity: 0.98,
        depthWrite: false
      })
    );
    eyePlane.position.set(0, 1.78, 1.215);
    reg('eyes')([eyePlane]);
    g.add(eyePlane);
    g.userData.renderEyes = renderEyes;

    // 3mm Silicone Base Shadow Gap Seam (NO Heart Indicator)
    const seamMat = new THREE.MeshStandardMaterial({
      color: 0x1E1B1C,
      roughness: 0.85
    });
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.40, 0.035, 16, 48), seamMat);
    seam.rotation.x = Math.PI / 2;
    seam.position.set(0, 0.16, 0.1);
    reg('seam')([seam]);
    g.add(seam);

    // Speaker Holes on Rear (7 micro-apertures)
    const spk = [];
    for (let i = -3; i <= 3; i++) {
      const hole = new THREE.Mesh(
        new THREE.CircleGeometry(0.036, 16),
        new THREE.MeshStandardMaterial({ color: 0x27272A, roughness: 0.85 })
      );
      hole.position.set(i * 0.075, 0.006 - Math.abs(i) * 0.003, -0.005);
      hole.rotation.y = Math.PI;
      spk.push(hole);
    }
    const speaker = new THREE.Group();
    speaker.position.set(0, 2.0, -0.83);
    speaker.rotation.x = -0.12;
    spk.forEach(h => speaker.add(h));
    reg('speaker')(spk);
    g.add(speaker);

    // Realistic USB-C Charge Port with CNC Chamfer & Gold Pin Contact Tongue
    const charge = new THREE.Group();
    const portBevel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.068, 0.04, 24),
      new THREE.MeshStandardMaterial({ color: 0x8E8B8C, roughness: 0.22, metalness: 0.9 })
    );
    portBevel.rotation.z = Math.PI / 2;
    const innerCavity = new THREE.Mesh(
      new THREE.BoxGeometry(0.088, 0.028, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x0A0809, roughness: 0.9 })
    );
    innerCavity.position.z = -0.01;
    const pinTongue = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, 0.008, 0.026),
      new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.28, metalness: 0.95 })
    );
    pinTongue.position.z = -0.008;

    charge.add(portBevel, innerCavity, pinTongue);
    charge.position.set(0, 0.35, -0.565);
    charge.rotation.x = -0.1;
    reg('charge')([portBevel, innerCavity, pinTongue]);
    g.add(charge);

    // Realistic MicroSD Slot with Eject Latch Chamfer
    const sdGroup = new THREE.Group();
    const sdOuter = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.044, 0.025),
      new THREE.MeshStandardMaterial({ color: 0x71717A, roughness: 0.25, metalness: 0.85 })
    );
    const sdSlot = new THREE.Mesh(
      new THREE.BoxGeometry(0.118, 0.018, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x0A0809, roughness: 0.9 })
    );
    sdSlot.position.z = 0.002;
    sdGroup.add(sdOuter, sdSlot);
    sdGroup.position.set(0.30, 0.35, -0.49);
    sdGroup.rotation.y = 0.55;
    reg('music')([sdOuter, sdSlot]);
    g.add(sdGroup);

    // Realistic Capacitive Power Crown with Concentric Machined Rings
    const power = new THREE.Group();
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.062, 0.062, 0.02, 32),
      new THREE.MeshStandardMaterial({ color: 0x27272A, roughness: 0.32, metalness: 0.8 })
    );
    cap.rotation.x = Math.PI / 2;
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.042, 0.004, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0x52525B, roughness: 0.25, metalness: 0.9 })
    );
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.022, 0.003, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0x52525B, roughness: 0.25, metalness: 0.9 })
    );
    power.add(cap, ring1, ring2);
    power.position.set(0, 2.55, -0.55);
    power.rotation.x = -0.35;
    reg('power')([cap, ring1, ring2]);
    g.add(power);

    return g;
  }

  const robotG = buildRobot();
  scene.add(robotG);

  const hitList = [];
  robotG.traverse(o => { if (o.isMesh && o.userData.part) hitList.push(o); });

  // --- 2. BUILD THE 3D PREMIUM METAL BOX ---
  const boxG = new THREE.Group();
  {
    const boxMat = new THREE.MeshPhysicalMaterial({ color: 0xD4D4D8, roughness: 0.22, metalness: 0.85, clearcoat: 0.4, clearcoatRoughness: 0.15, side: THREE.DoubleSide });

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
        map: createTextTexture('SN 0000-AMI-0001 · USB-C · 5 V, 2 A', { h: 96, size: 40, color: '#71717A', ls: 4 }),
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

    // Brushed Metal Band
    const bandMat = new THREE.MeshStandardMaterial({ color: 0xA1A1AA, roughness: 0.30, metalness: 0.75, side: THREE.DoubleSide, transparent: true });
    const band = new THREE.Mesh(new THREE.BoxGeometry(2.47, 0.40, 1.37), bandMat);
    band.position.y = 0.42;
    band.castShadow = true;

    const bandLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 0.24),
      new THREE.MeshBasicMaterial({
        map: createTextTexture('AMI · A SMALL FRIEND FOR BIG DAYS', { w: 1024, h: 120, size: 46, ls: 6, color: '#27272A' }),
        transparent: true
      })
    );
    bandLabel.position.set(0, 0, 0.688);
    band.add(bandLabel);
    boxG.add(band);

    // High-Density Black EVA Foam Bed
    const foamMat = new THREE.MeshStandardMaterial({ color: 0x18181B, roughness: 0.92, metalness: 0.05 });
    const foamBed = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.35, 1.26), foamMat);
    foamBed.position.y = 0.48;
    foamBed.castShadow = true;
    foamBed.receiveShadow = true;
    boxG.add(foamBed);

    // Mini companion inside foam cradle
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
    visor: "Visor & Eyes · Dark curved glass visor with two glowing blue eyes (^ ^ / > < / - -). No mouth — AMI speaks with light.",
    ears: "Bear Ears · Smooth rounded top ears seamlessly molded into the matte white unibody.",
    seam: "3mm Base Seam · Minimal shadow gap baseline seam with zero visible screws. Clean matte physical enclosure.",
    power: "Capacitive Power Crown · Top sensor with laser-etched concentric acoustic/touch rings. Hold to start/end session.",
    speaker: "Speaker Arc · 7 acoustic micro-perforations on the rear. Plays royalty-free audio locally from microSD.",
    charge: "Precision USB-C · CNC-machined metal bezel with internal gold-plated contact tongue.",
    music: "MicroSD Slot · Recessed CNC spring-latch card slot. Holds 32GB preloaded soundscapes.",
    shell: "Matte Shell · Soft-touch unibody with 3mm shadow gap. No visible screws, zero plastic wrap.",
    packinfo: "Premium PR Box · Brushed anodized aluminum with custom EVA foam cradle. Magnetic closure.",
    packlabel: "Laser-Etched Lid · Precision laser marking on brushed metal surface."
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

  // Emotion Management (^ ^ Happy, > < Silly, - - Neutral)
  let currentEmotion = 'happy';
  function setRobotEmotion(emotion) {
    currentEmotion = emotion;
    if (robotG.userData.renderEyes) {
      robotG.userData.renderEyes(emotion, 1.0);
    }
    document.querySelectorAll('.emotion-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.emo === emotion);
    });
    if (amiCaptionText) {
      if (emotion === 'happy') amiCaptionText.textContent = "AMI is happy to focus with you (^ ^)";
      else if (emotion === 'silly') amiCaptionText.textContent = "AMI is feeling playful and bright (> <)";
      else amiCaptionText.textContent = "AMI is in deep calm focus mode (- -)";
    }
  }

  // Emotion Chip Click Handlers
  document.querySelectorAll('.emotion-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      setRobotEmotion(btn.dataset.emo);
    });
  });

  // 3D Eye Blink Animation
  let is3DBlinking = false;
  function trigger3DBlink() {
    if (is3DBlinking || !robotG.userData.renderEyes) return;
    is3DBlinking = true;
    const t0 = performance.now();
    const dur = 190;
    function animBlink() {
      const elapsed = performance.now() - t0;
      const p = Math.min(1, elapsed / dur);
      const sY = p < 0.5 ? (1 - (p / 0.5) * 0.95) : (0.05 + ((p - 0.5) / 0.5) * 0.95);
      robotG.userData.renderEyes(currentEmotion, sY);
      if (p < 1) {
        requestAnimationFrame(animBlink);
      } else {
        robotG.userData.renderEyes(currentEmotion, 1.0);
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

    // Subtle gentle float breathing
    if (robotG.visible) {
      robotG.position.y = Math.sin(t * 1.6) * 0.03;
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
