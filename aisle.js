import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const section = document.querySelector(".aisle");
const canvas = document.querySelector(".aisle-view");
const beats = [...document.querySelectorAll(".aisle-beat")];
const rail = document.querySelector(".aisle-rail span");
if (!section || !canvas) throw new Error("aisle missing");

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduce) section.dataset.static = "";

const fogColor = 0xe6eef6;
const scene = new THREE.Scene();
scene.background = new THREE.Color(fogColor);
scene.fog = new THREE.Fog(fogColor, 7, 32);

const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 80);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

scene.add(new THREE.HemisphereLight(0xf7fbff, 0xb7c6d6, 1.35));
const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(-4, 10, 6);
scene.add(sun);
const blue = new THREE.PointLight(0x35a4ea, 8, 12);
blue.position.set(-1.2, 1.6, 2);
scene.add(blue);

function ledTexture(cool) {
  const board = document.createElement("canvas");
  board.width = 160;
  board.height = 320;
  const ctx = board.getContext("2d");
  ctx.fillStyle = "#d5dee8";
  ctx.fillRect(0, 0, 160, 320);
  for (let y = 10; y < 310; y += 34) {
    ctx.fillStyle = "#b7c3d0";
    ctx.fillRect(10, y, 140, 22);
    ctx.fillStyle = "#eef3f8";
    ctx.fillRect(14, y + 3, 132, 16);
    for (let x = 20; x < 140; x += 14) {
      const on = ((x + y) % 28) !== 0;
      ctx.fillStyle = on ? (cool && x % 28 === 0 ? "#35a4ea" : "#f4f8fc") : "#9aa8b8";
      ctx.fillRect(x, y + 7, 7, 5);
    }
  }
  const texture = new THREE.CanvasTexture(board);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

const faceA = new THREE.MeshStandardMaterial({ map: ledTexture(true), roughness: 0.55, metalness: 0.08 });
const faceB = new THREE.MeshStandardMaterial({ map: ledTexture(false), roughness: 0.55, metalness: 0.08 });
const shell = new THREE.MeshStandardMaterial({ color: 0xd7e0ea, roughness: 0.72, metalness: 0.04 });
const rackGeo = new THREE.BoxGeometry(1.15, 2.7, 0.78);

function addRack(x, z, face) {
  const mats = x < 0
    ? [face, shell, shell, shell, shell, shell]
    : [shell, face, shell, shell, shell, shell];
  const rack = new THREE.Mesh(rackGeo, mats);
  rack.position.set(x, 1.35, z);
  scene.add(rack);
}

for (let i = 0; i < 16; i += 1) {
  const face = i % 2 ? faceA : faceB;
  addRack(-2.35, 6 - i * 3.1, face);
  addRack(2.55, 4.4 - i * 3.1, face);
}

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(28, 70),
  new THREE.MeshStandardMaterial({ color: 0xe8eef5, roughness: 1, metalness: 0 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.z = -12;
scene.add(floor);

const platform = new THREE.Mesh(
  new THREE.CylinderGeometry(2.4, 2.6, 0.18, 8),
  new THREE.MeshStandardMaterial({ color: 0xf3f7fb, roughness: 0.4, metalness: 0.1 })
);
platform.position.set(0.2, 0.09, -8);
scene.add(platform);

const poleMat = new THREE.MeshStandardMaterial({ color: 0xc5d0dc, roughness: 0.4, metalness: 0.2 });
const cableMat = new THREE.MeshBasicMaterial({ color: 0x9eb0c4 });
for (let i = 0; i < 8; i += 1) {
  const z = 4 - i * 5.5;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 3.4, 8), poleMat);
  pole.position.set(i % 2 ? 0.15 : -0.2, 1.7, z);
  scene.add(pole);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.2, 3.15, z),
    new THREE.Vector3(0, 2.75, z),
    new THREE.Vector3(3.3, 3.2, z + 0.4),
  ]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.012, 5, false), cableMat));
}

function resize() {
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || window.innerHeight;
  if (!width || !height) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function progress() {
  if (reduce) return 0.35;
  const travel = section.offsetHeight - window.innerHeight;
  if (travel <= 0) return 0;
  const scrolled = -section.getBoundingClientRect().top;
  return Math.min(1, Math.max(0, scrolled / travel));
}

const start = new THREE.Vector3(0.15, 1.72, 7.2);
const end = new THREE.Vector3(-0.05, 1.42, -14.5);
const look = new THREE.Vector3();

function frame() {
  const p = progress();
  camera.position.lerpVectors(start, end, p);
  camera.position.x += Math.sin(p * Math.PI) * 0.28;
  look.set(0, 1.25, camera.position.z - 9);
  camera.lookAt(look);
  blue.position.z = camera.position.z - 3.5;
  beats.forEach((beat, index) => {
    const center = index / (beats.length - 1);
    const opacity = Math.max(0, 1 - Math.abs(p - center) / 0.2);
    beat.style.opacity = opacity.toFixed(3);
  });
  if (rail) rail.style.transform = `scaleY(${(0.08 + p * 0.92).toFixed(3)})`;
  renderer.render(scene, camera);
}

resize();
frame();

if (!reduce) {
  let ticking = false;
  const request = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = section.getBoundingClientRect();
      if (rect.bottom > -200 && rect.top < window.innerHeight + 200) frame();
      ticking = false;
    });
  };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", () => { resize(); frame(); });
} else {
  window.addEventListener("resize", () => { resize(); frame(); });
}
