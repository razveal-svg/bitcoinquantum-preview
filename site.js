document.documentElement.classList.add("js");

const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
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
