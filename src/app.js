const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

function revealActions() {
  const actions = document.getElementById("hero-actions");
  if (!actions) return;
  actions.classList.remove("is-pending");
  actions.classList.add("is-ready");
}

function runTypewriter() {
  const target = document.getElementById("typewriter");
  const cursor = document.querySelector(".type-cursor");
  if (!target) {
    revealActions();
    return;
  }

  const fullText = target.dataset.type || "";
  if (reduceMotion) {
    target.textContent = fullText;
    cursor?.classList.add("is-done");
    revealActions();
    return;
  }

  let index = 0;
  let skipped = false;
  target.textContent = "";

  const finish = () => {
    skipped = true;
    target.textContent = fullText;
    cursor?.classList.add("is-done");
    revealActions();
  };

  const tick = () => {
    if (skipped) return;
    target.textContent = fullText.slice(0, index + 1);
    index += 1;
    if (index < fullText.length) {
      window.setTimeout(tick, 28);
    } else {
      cursor?.classList.add("is-done");
      window.setTimeout(revealActions, 180);
    }
  };

  document.addEventListener("pointerdown", finish, { once: true });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") finish();
  }, { once: true });

  window.setTimeout(tick, 420);
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
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
  );

  nodes.forEach((node) => observer.observe(node));
}

function setupStoryRail() {
  const rail = document.querySelector(".story-rail");
  const links = [...document.querySelectorAll("[data-story]")];
  const sections = links
    .map((link) => document.getElementById(link.dataset.story))
    .filter(Boolean);

  if (!rail || !sections.length) return;

  const setActive = (id) => {
    links.forEach((link) => link.classList.toggle("is-active", link.dataset.story === id));
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -45% 0px", threshold: [0.08, 0.25, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
  }

  const updateProgress = () => {
    const maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const value = Math.max(0, Math.min(1, window.scrollY / maximum));
    rail.style.setProperty("--rail-progress", `${value * 100}%`);
  };

  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
}

function setupParallax() {
  const portrait = document.querySelector("[data-parallax]");
  const hero = document.querySelector(".hero");
  if (!portrait || !hero || reduceMotion) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;

  hero.addEventListener("pointermove", (event) => {
    const box = hero.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width - 0.5) * 12;
    const y = ((event.clientY - box.top) / box.height - 0.5) * 12;
    portrait.style.setProperty("--px", `${x}px`);
    portrait.style.setProperty("--py", `${y}px`);
  });

  hero.addEventListener("pointerleave", () => {
    portrait.style.setProperty("--px", "0px");
    portrait.style.setProperty("--py", "0px");
  });
}

runTypewriter();
setupFlyIns();
setupStoryRail();
setupParallax();
