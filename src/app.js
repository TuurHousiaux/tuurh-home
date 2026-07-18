document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const typeLines = [...document.querySelectorAll("[data-type]")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (typeLines.length) {
  if (reduceMotion) {
    typeLines.forEach((line) => { line.textContent = line.dataset.type; });
  } else {
    typeLines.forEach((line) => {
      line.textContent = "";
      line.classList.add("is-typing");
    });
    let lineIndex = 0;
    let characterIndex = 0;
    const typeNext = () => {
      const line = typeLines[lineIndex];
      if (!line) return;
      line.textContent = line.dataset.type.slice(0, characterIndex + 1);
      characterIndex += 1;
      if (characterIndex < line.dataset.type.length) {
        window.setTimeout(typeNext, 58);
      } else {
        lineIndex += 1;
        characterIndex = 0;
        window.setTimeout(typeNext, 180);
      }
    };
    window.setTimeout(typeNext, 300);
  }
}

if (!reduceMotion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  document.querySelectorAll(".workbench-heading, .portal, .manifesto-copy, .manifesto-list li, .contact-panel").forEach((element) => {
    element.classList.add("reveal");
    observer.observe(element);
  });
}
