document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

document.querySelectorAll("[data-date]").forEach((element) => {
  element.textContent = new Intl.DateTimeFormat("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
});

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function runTypewriter() {
  const target = document.getElementById("typewriter");
  const cursor = document.querySelector(".type-cursor");
  if (!target || reduceMotion) {
    cursor?.classList.add("is-done");
    return;
  }

  const fullText = target.dataset.type || target.textContent.trim();
  if (!fullText) return;

  let index = 0;
  let skipped = false;
  target.textContent = "";
  cursor?.classList.remove("is-done");

  const finish = () => {
    skipped = true;
    target.textContent = fullText;
    cursor?.classList.add("is-done");
  };

  const tick = () => {
    if (skipped) return;
    target.textContent = fullText.slice(0, index + 1);
    index += 1;
    if (index < fullText.length) {
      window.setTimeout(tick, 22);
    } else {
      cursor?.classList.add("is-done");
    }
  };

  document.addEventListener("pointerdown", finish, { once: true });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") finish();
  }, { once: true });

  window.setTimeout(tick, 280);
}

function setupFlyIns() {
  const nodes = [...document.querySelectorAll("[data-fly]")];
  if (!nodes.length) return;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -4% 0px" },
  );

  nodes.forEach((node) => {
    if (node.getBoundingClientRect().top < window.innerHeight * 0.92) {
      node.classList.add("is-in");
    } else {
      observer.observe(node);
    }
  });
}

function setupParallax() {
  const portrait = document.querySelector("[data-parallax]");
  const hero = document.querySelector(".masthead");
  if (!portrait || !hero || reduceMotion) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;

  hero.addEventListener("pointermove", (event) => {
    const box = hero.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width - 0.5) * 8;
    const y = ((event.clientY - box.top) / box.height - 0.5) * 8;
    portrait.style.transform = `translate(${x}px, ${y}px)`;
  });

  hero.addEventListener("pointerleave", () => {
    portrait.style.transform = "translate(0, 0)";
  });
}

runTypewriter();
setupFlyIns();
setupParallax();
