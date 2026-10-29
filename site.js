document.documentElement.classList.add("js");

const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
const plates = [...document.querySelectorAll(".plate")];
const sceneMarks = [...document.querySelectorAll("main [data-scene]")];

function paintScenes() {
  const viewHeight = window.innerHeight;
  const line = Math.max(168, viewHeight * 0.22);
  const fade = Math.max(150, viewHeight * 0.16);
  const atEnd = window.scrollY + viewHeight >= document.documentElement.scrollHeight - 4;
  let index = 0;
  if (atEnd) {
    index = sceneMarks.length - 1;
  } else {
    sceneMarks.forEach((mark, markIndex) => {
      if (mark.getBoundingClientRect().top <= line) index = markIndex;
    });
  }
  const current = sceneMarks[index];
  const next = sceneMarks[Math.min(index + 1, sceneMarks.length - 1)];
  let blend = 0;
  if (!atEnd && current.dataset.scene !== next.dataset.scene) {
    const nextTop = next.getBoundingClientRect().top;
    blend = (line + fade - nextTop) / fade;
    blend = Math.min(1, Math.max(0, blend));
    blend = blend * blend * (3 - 2 * blend);
  }
  const drift = window.scrollY * 0.04;
  for (const plate of plates) {
    const name = plate.dataset.scene;
    let opacity = 0;
    if (name === current.dataset.scene) opacity = 1 - blend;
    if (name === next.dataset.scene) opacity = Math.max(opacity, blend);
    plate.style.opacity = opacity.toFixed(3);
    const lift = (1 - opacity) * 16 - drift;
    plate.style.transform = `scale(${(1.06 + opacity * 0.05).toFixed(3)}) translate3d(0, ${lift.toFixed(1)}px, 0)`;
  }
}

if (!motion.matches) {
  let ticking = false;
  const requestPaint = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      paintScenes();
      ticking = false;
    });
  };
  paintScenes();
  window.addEventListener("scroll", requestPaint, { passive: true });
  window.addEventListener("resize", requestPaint);
}

const reveal = document.querySelectorAll(".reveal");

if (!motion.matches && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("in");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.18 });
  reveal.forEach((element) => observer.observe(element));
} else {
  reveal.forEach((element) => element.classList.add("in"));
}

const menu = document.querySelector(".menu");
const links = document.querySelector(".links");

menu.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  menu.setAttribute("aria-expanded", open ? "true" : "false");
  menu.textContent = open ? "Close" : "Menu";
});

links.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    links.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
    menu.textContent = "Menu";
  }
});

const form = document.querySelector("#list-form");
const status = document.querySelector("#form-status");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = new FormData(form).get("email").toString().trim();
  const body = encodeURIComponent(
    `Please add ${email} to the Bitcoin Quantum mainnet list.`
  );
  const subject = encodeURIComponent("Mainnet list");
  window.location.href = `mailto:oscar@btq.com?subject=${subject}&body=${body}`;
  status.textContent = "Your mail app should open with the request. If it does not, write to oscar@btq.com.";
});
