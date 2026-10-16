import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const START_NG = "https://start.ng";
const DEFAULT_STYLE = {
  body: "female",
  primaryColor: "#d97c50",
  secondaryColor: "#42694f",
  skinColor: "#bb805d",
  hairColor: "#3a3028",
  hair: "braids",
  hat: "none",
  accessory: "scarf",
};
const GEM_TOTAL = 6;
const ARENA_LIMIT = 6.35;

const canvas = document.querySelector("#scene");
const ui = {
  connection: document.querySelector("#connection-status"),
  connectionLabel: document.querySelector("#connection-label"),
  playerName: document.querySelector("#player-name"),
  playerAccount: document.querySelector("#player-account"),
  playerFace: document.querySelector("#player-face"),
  playerMonogram: document.querySelector("#player-monogram"),
  signIn: document.querySelector("#sign-in-link"),
  intro: document.querySelector("#intro-panel"),
  start: document.querySelector("#start-button"),
  hud: document.querySelector("#run-hud"),
  score: document.querySelector("#score-count"),
  lives: document.querySelector("#life-dots"),
  end: document.querySelector("#end-panel"),
  endKicker: document.querySelector("#end-kicker"),
  endTitle: document.querySelector("#end-title"),
  endCopy: document.querySelector("#end-copy"),
  restart: document.querySelector("#restart-button"),
  touchPad: document.querySelector("#touch-pad"),
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#b8e3bd");
scene.fog = new THREE.Fog("#b8e3bd", 16, 33);

const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(0, 10.6, 13.4);
camera.lookAt(0, 0, 0);

scene.add(new THREE.HemisphereLight("#fff6da", "#4b7654", 2.1));
const sun = new THREE.DirectionalLight("#fff6d9", 3.2);
sun.position.set(-5, 10, 7);
scene.add(sun);
const fill = new THREE.DirectionalLight("#c7f1bb", 1.25);
fill.position.set(7, 5, -6);
scene.add(fill);

const mat = (color, roughness = 0.78, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const floorMaterial = mat("#8fbe82");
const stemMaterial = mat("#4e8257");
const leafMaterial = mat("#d9efaa");
const darkMaterial = mat("#293f35", 0.45);

const ground = new THREE.Mesh(new THREE.CircleGeometry(8.2, 72), floorMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.16;
scene.add(ground);

const grid = new THREE.GridHelper(16.2, 18, "#5d9362", "#73a771");
grid.position.y = -0.145;
grid.material.transparent = true;
grid.material.opacity = 0.21;
scene.add(grid);

const boundary = new THREE.Mesh(new THREE.TorusGeometry(7.8, 0.08, 8, 80), mat("#d5e8a4", 0.6));
boundary.rotation.x = Math.PI / 2;
boundary.position.y = -0.04;
scene.add(boundary);

function makePlant(x, z, height, lean) {
  const plant = new THREE.Group();
  plant.position.set(x, 0, z);
  plant.rotation.z = lean;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, height, 6), stemMaterial);
  stem.position.y = height / 2;
  plant.add(stem);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 7, 5), leafMaterial);
  leaf.scale.set(0.45, 1.45, 0.55);
  leaf.position.set(0.13, height * 0.78, 0);
  plant.add(leaf);
  scene.add(plant);
}

for (let index = 0; index < 22; index += 1) {
  const angle = (index / 22) * Math.PI * 2;
  const radius = 7.15 + (index % 3) * 0.28;
  makePlant(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.55 + (index % 4) * 0.12, Math.sin(angle) * 0.23);
}

function colorFromStyle(value, fallback) {
  return typeof value === "string" && /^#[\da-f]{6}$/i.test(value) ? value : fallback;
}

function styleFromPlayer(player) {
  const source = player?.style ?? {};
  return {
    body: source.body === "male" || source.body === "female" ? source.body : DEFAULT_STYLE.body,
    primaryColor: colorFromStyle(source.primaryColor, DEFAULT_STYLE.primaryColor),
    secondaryColor: colorFromStyle(source.secondaryColor, DEFAULT_STYLE.secondaryColor),
    skinColor: colorFromStyle(source.skinColor, DEFAULT_STYLE.skinColor),
    hairColor: colorFromStyle(source.hairColor, DEFAULT_STYLE.hairColor),
    hair: ["short", "afro", "braids", "bun", "ponytail", "dreads", "bald"].includes(source.hair) ? source.hair : DEFAULT_STYLE.hair,
    hat: ["none", "cap", "beanie", "tophat", "crown"].includes(source.hat) ? source.hat : "none",
    accessory: ["none", "glasses", "earrings", "beard", "scarf", "backpack"].includes(source.accessory) ? source.accessory : "none",
  };
}

function cylinderBetween(start, end, radius, material, segments = 8) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), segments), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function createCharacter(style) {
  const character = new THREE.Group();
  const bodyWidth = style.body === "female" ? 0.58 : 0.65;
  const shirt = mat(style.primaryColor);
  const trousers = mat(style.secondaryColor);
  const skin = mat(style.skinColor);
  const hair = mat(style.hairColor);
  const shoe = mat("#f3ebd3");

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.54, 0.22), trousers);
  backpack.position.set(0, 1.24, -0.34);
  character.add(backpack);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(bodyWidth * 0.48, 0.56, 4, 8), shirt);
  torso.position.y = 1.32;
  character.add(torso);

  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.34, 0.35, 8), trousers);
  hips.position.y = 0.83;
  character.add(hips);

  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.46, 3, 6), trousers);
    leg.position.set(side * 0.17, 0.43, 0);
    character.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.13, 0.35), shoe);
    foot.position.set(side * 0.17, 0.12, 0.07);
    character.add(foot);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.48, 3, 6), shirt);
    arm.position.set(side * (bodyWidth * 0.57), 1.35, 0.02);
    arm.rotation.z = side * -0.18;
    character.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), skin);
    hand.position.set(side * (bodyWidth * 0.6), 1.0, 0.02);
    character.add(hand);
  }

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.19, 8), skin);
  neck.position.y = 1.82;
  character.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.31, 12, 10), skin);
  head.scale.set(0.92, 1.08, 0.9);
  head.position.y = 2.13;
  character.add(head);

  const eyeMaterial = mat("#273a32", 0.42);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), eyeMaterial);
    eye.position.set(side * 0.09, 2.16, 0.276);
    character.add(eye);
  }

  if (style.hair !== "bald") {
    if (style.hair === "afro") {
      const afro = new THREE.Mesh(new THREE.SphereGeometry(0.37, 10, 8), hair);
      afro.position.set(0, 2.36, -0.015);
      character.add(afro);
    } else {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.315, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.54), hair);
      cap.position.set(0, 2.15, 0);
      character.add(cap);
      if (["braids", "dreads"].includes(style.hair)) {
        const count = style.hair === "braids" ? 4 : 3;
        for (let index = 0; index < count; index += 1) {
          const offset = (index - (count - 1) / 2) * 0.13;
          const plait = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.42, 2, 5), hair);
          plait.position.set(offset, 1.98 - (index % 2) * 0.08, 0.12);
          plait.rotation.z = offset * 0.5;
          character.add(plait);
        }
      }
      if (style.hair === "bun") {
        const bun = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), hair);
        bun.position.set(0, 2.45, -0.23);
        character.add(bun);
      }
      if (style.hair === "ponytail") {
        character.add(cylinderBetween(new THREE.Vector3(0, 2.33, -0.2), new THREE.Vector3(0.08, 1.94, -0.49), 0.075, hair, 7));
      }
    }
  }

  if (style.hat !== "none") {
    const hatMaterial = mat(style.hat === "crown" ? "#e4ad4e" : style.primaryColor, 0.58, { metalness: 0.08 });
    if (style.hat === "cap") {
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.31, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.47), hatMaterial);
      crown.position.y = 2.39;
      character.add(crown);
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.055, 0.27), hatMaterial);
      brim.position.set(0, 2.38, 0.21);
      character.add(brim);
    } else if (style.hat === "beanie") {
      const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.62), hatMaterial);
      beanie.position.y = 2.37;
      character.add(beanie);
    } else if (style.hat === "tophat") {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.38, 8), hatMaterial);
      top.position.y = 2.52;
      character.add(top);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.055, 10), hatMaterial);
      brim.position.y = 2.35;
      character.add(brim);
    } else {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.08, 8), hatMaterial);
      base.position.y = 2.37;
      character.add(base);
      for (let index = 0; index < 5; index += 1) {
        const angle = (index / 5) * Math.PI * 2;
        const point = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 4), hatMaterial);
        point.position.set(Math.cos(angle) * 0.2, 2.52, Math.sin(angle) * 0.2);
        character.add(point);
      }
    }
  }

  backpack.visible = style.accessory === "backpack";
  if (style.accessory === "glasses") {
    const glassMaterial = mat("#293c33", 0.35, { metalness: 0.35 });
    for (const side of [-1, 1]) {
      const lens = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 5, 12), glassMaterial);
      lens.position.set(side * 0.095, 2.16, 0.295);
      character.add(lens);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.018, 0.025), glassMaterial);
    bridge.position.set(0, 2.16, 0.3);
    character.add(bridge);
  } else if (style.accessory === "earrings") {
    for (const side of [-1, 1]) {
      const earring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 5, 10), mat("#e7b54e", 0.38, { metalness: 0.55 }));
      earring.position.set(side * 0.28, 1.99, 0.04);
      character.add(earring);
    }
  } else if (style.accessory === "beard") {
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), hair);
    beard.scale.set(1, 0.58, 0.55);
    beard.position.set(0, 1.97, 0.19);
    character.add(beard);
  } else if (style.accessory === "scarf") {
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.075, 6, 12), mat("#e97153"));
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 1.72;
    character.add(scarf);
  }

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.52, 18), mat("#3d704a", 1, { transparent: true, opacity: 0.27 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  character.add(shadow);

  return character;
}

let currentPlayer = { name: "Guest", account: null, style: DEFAULT_STYLE, face: null };
let playerMesh = createCharacter(DEFAULT_STYLE);
scene.add(playerMesh);

function applyPlayer(reply) {
  const signedIn = Boolean(reply?.user);
  const player = reply?.user ?? reply?.guest ?? currentPlayer;
  currentPlayer = {
    name: typeof player?.name === "string" ? player.name : "Guest",
    account: signedIn && typeof player?.account === "string" ? player.account : null,
    style: styleFromPlayer(player),
    face: typeof player?.face === "string" ? player.face : null,
  };

  ui.playerName.textContent = currentPlayer.name;
  ui.playerAccount.textContent = currentPlayer.account ? `@${currentPlayer.account}` : "GUEST RUNNER";
  ui.playerMonogram.textContent = currentPlayer.name.trim().charAt(0).toUpperCase() || "G";
  ui.playerFace.hidden = !currentPlayer.face;
  ui.playerMonogram.hidden = Boolean(currentPlayer.face);
  if (currentPlayer.face) ui.playerFace.src = currentPlayer.face;
  ui.signIn.hidden = signedIn;
  ui.connection.classList.toggle("is-live", signedIn);
  ui.connectionLabel.textContent = signedIn ? "START.NG RUNNER CONNECTED" : location.hostname.endsWith(".start.ng") ? "GUEST RUNNER" : "LOCAL PREVIEW";

  const position = playerMesh.position.clone();
  scene.remove(playerMesh);
  playerMesh = createCharacter(currentPlayer.style);
  playerMesh.position.copy(position);
  scene.add(playerMesh);
}

let connectFramePromise;
function connectFrame() {
  if (!connectFramePromise) {
    connectFramePromise = new Promise((resolve, reject) => {
      const frame = document.createElement("iframe");
      frame.src = `${START_NG}/connect`;
      frame.hidden = true;
      frame.title = "start.ng connection";
      frame.onload = () => resolve(frame);
      frame.onerror = reject;
      document.body.append(frame);
    });
  }
  return connectFramePromise;
}

async function askStartNg(message, replyType, timeoutMs = 4500) {
  let frame;
  try {
    frame = await connectFrame();
  } catch {
    connectFramePromise = undefined;
    return null;
  }
  if (!frame.contentWindow) return null;

  return new Promise((resolve) => {
    const requestId = Math.random().toString(36).slice(2);
    const finish = (reply) => {
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve(reply);
    };
    const timer = window.setTimeout(() => finish(null), timeoutMs);
    function onMessage(event) {
      if (event.origin !== START_NG || event.source !== frame.contentWindow) return;
      if (event.data?.type === replyType && event.data.requestId === requestId) finish(event.data);
    }
    window.addEventListener("message", onMessage);
    frame.contentWindow.postMessage({ ...message, requestId }, START_NG);
  });
}

async function refreshPlayer() {
  const reply = await askStartNg({ type: "startng:whoami" }, "startng:user");
  if (reply) applyPlayer(reply);
  else if (!location.hostname.endsWith(".start.ng")) applyPlayer({ guest: currentPlayer });
}

ui.signIn.href = `https://start.ng/?return_to=${encodeURIComponent(location.origin + location.pathname)}`;
void refreshPlayer();
window.addEventListener("focus", () => void refreshPlayer());
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") void refreshPlayer();
});

const gemPositions = [
  [-4.5, -3.6], [-1.5, -4.7], [3.4, -4.2],
  [4.8, 0.8], [1.8, 4.4], [-3.7, 3.5],
];
const gems = gemPositions.map(([x, z], index) => {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20), mat("#d9f367", 0.9, { transparent: true, opacity: 0.24 }));
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.025;
  group.add(glow);
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.31, 0),
    mat(index % 2 === 0 ? "#f0d765" : "#e97153", 0.32, { metalness: 0.12, emissive: index % 2 === 0 ? "#b19b35" : "#9e422d", emissiveIntensity: 0.2 }),
  );
  crystal.position.y = 0.62;
  group.add(crystal);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.025, 5, 18), mat("#f6f1df", 0.45, { transparent: true, opacity: 0.8 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.24;
  group.add(ring);
  group.userData.crystal = crystal;
  group.userData.ring = ring;
  group.userData.collected = false;
  scene.add(group);
  return group;
});

const hazards = [0, 1, 2].map((index) => {
  const group = new THREE.Group();
  const thorn = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 0), mat("#e97153", 0.48, { emissive: "#9f3d2c", emissiveIntensity: 0.14 }));
  group.add(thorn);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.025, 5, 18), mat("#f6f1df", 0.5, { transparent: true, opacity: 0.72 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.2;
  group.add(ring);
  group.userData.phase = index * (Math.PI * 2 / 3);
  group.userData.speed = 0.34 + index * 0.06;
  scene.add(group);
  return group;
});

const heldKeys = new Set();
const validKeys = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"]);
let isPlaying = false;
let score = 0;
let lives = 3;
let elapsed = 0;
let hitCooldown = 0;
let lastFrame = performance.now();

function updateHud() {
  ui.score.textContent = String(score).padStart(2, "0");
  [...ui.lives.children].forEach((dot, index) => dot.classList.toggle("is-lost", index >= lives));
  ui.lives.setAttribute("aria-label", `${lives} ${lives === 1 ? "chance" : "chances"} remaining`);
}

function startRun() {
  score = 0;
  lives = 3;
  elapsed = 0;
  hitCooldown = 0;
  playerMesh.position.set(0, 0, 0);
  gems.forEach((gem) => {
    gem.userData.collected = false;
    gem.visible = true;
  });
  ui.intro.hidden = true;
  ui.end.hidden = true;
  ui.hud.hidden = false;
  ui.touchPad.hidden = false;
  updateHud();
  isPlaying = true;
}

function finishRun(won) {
  isPlaying = false;
  heldKeys.clear();
  ui.hud.hidden = true;
  ui.touchPad.hidden = true;
  ui.end.hidden = false;
  ui.endKicker.textContent = won ? "EXPEDITION COMPLETE" : "THE BRAMBLES GOT CLOSE";
  ui.endTitle.textContent = won ? "Well gathered." : "Back to the trail.";
  ui.endCopy.textContent = won
    ? `${currentPlayer.name}, you found all six lights.`
    : `${currentPlayer.name}, you gathered ${score} of the six lights.`;
}

ui.start.addEventListener("click", startRun);
ui.restart.addEventListener("click", startRun);

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (!validKeys.has(key)) return;
  event.preventDefault();
  heldKeys.add(key);
});
window.addEventListener("keyup", (event) => heldKeys.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => heldKeys.clear());

ui.touchPad.querySelectorAll("button[data-key]").forEach((button) => {
  const key = button.dataset.key.toLowerCase();
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    heldKeys.add(key);
    button.setPointerCapture(event.pointerId);
  });
  const release = () => heldKeys.delete(key);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});

function movePlayer(delta) {
  const direction = new THREE.Vector3(
    Number(heldKeys.has("d") || heldKeys.has("arrowright")) - Number(heldKeys.has("a") || heldKeys.has("arrowleft")),
    0,
    Number(heldKeys.has("s") || heldKeys.has("arrowdown")) - Number(heldKeys.has("w") || heldKeys.has("arrowup")),
  );
  if (direction.lengthSq() === 0) return;
  direction.normalize();
  playerMesh.position.addScaledVector(direction, delta * 5.2);
  playerMesh.position.x = THREE.MathUtils.clamp(playerMesh.position.x, -ARENA_LIMIT, ARENA_LIMIT);
  playerMesh.position.z = THREE.MathUtils.clamp(playerMesh.position.z, -ARENA_LIMIT, ARENA_LIMIT);
  playerMesh.rotation.y = Math.atan2(direction.x, direction.z);
}

function updateGame(delta) {
  elapsed += delta;
  hitCooldown = Math.max(0, hitCooldown - delta);
  movePlayer(delta);
  playerMesh.position.y = Math.abs(Math.sin(elapsed * 8)) * 0.045;

  gems.forEach((gem, index) => {
    if (gem.userData.collected) return;
    gem.userData.crystal.rotation.y += delta * 1.25;
    gem.userData.crystal.rotation.x = Math.sin(elapsed * 1.8 + index) * 0.15;
    gem.userData.crystal.position.y = 0.62 + Math.sin(elapsed * 2.4 + index) * 0.09;
    gem.userData.ring.rotation.z += delta * 0.45;
    if (Math.hypot(playerMesh.position.x - gem.position.x, playerMesh.position.z - gem.position.z) < 0.76) {
      gem.userData.collected = true;
      gem.visible = false;
      score += 1;
      updateHud();
      if (score === GEM_TOTAL) finishRun(true);
    }
  });

  hazards.forEach((hazard) => {
    const phase = elapsed * hazard.userData.speed + hazard.userData.phase;
    hazard.position.set(Math.cos(phase) * 4.55, 0.53, Math.sin(phase * 1.17) * 4.35);
    hazard.rotation.x += delta * 0.7;
    hazard.rotation.y += delta * 1.1;
    if (hitCooldown === 0 && Math.hypot(playerMesh.position.x - hazard.position.x, playerMesh.position.z - hazard.position.z) < 0.82) {
      lives -= 1;
      hitCooldown = 1.3;
      playerMesh.position.set(0, 0, 0);
      updateHud();
      if (lives <= 0) finishRun(false);
    }
  });
}

function animate(now) {
  requestAnimationFrame(animate);
  const delta = Math.min((now - lastFrame) / 1000, 0.04);
  lastFrame = now;
  if (isPlaying) updateGame(delta);
  else {
    elapsed += delta * 0.35;
    playerMesh.position.y = Math.sin(elapsed * 2.2) * 0.035;
  }
  renderer.render(scene, camera);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
requestAnimationFrame(animate);