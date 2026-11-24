/** Keep the existing buttons and their handlers when exposing compact tools. */
export function initResponsiveToolbar() {
  const dock = document.getElementById("bottom-toolbar");
  if (!dock || dock.querySelector(".responsive-more")) return;
  const primary = new Set(["btn-load-ifc", "btn-focus", "btn-dock-measure", "btn-section-cut"]);
  for (const button of dock.querySelectorAll<HTMLButtonElement>("button.dock-icon")) {
    const kind = primary.has(button.id) ? "compact-primary" : "compact-secondary";
    button.classList.add(kind);
    button.closest(".dock-item")?.classList.add(kind + "-item");
    const label = button.getAttribute("aria-label") || button.title;
    if (label) button.setAttribute("aria-label", label);
  }
  const more = document.createElement("button");
  more.type = "button";
  more.className = "btn-tool responsive-more";
  more.textContent = "More";
  more.setAttribute("aria-expanded", "false");
  more.setAttribute("aria-label", "More tools");
  more.setAttribute("aria-controls", dock.id);
  dock.append(more);
  const close = () => {
    const restoreFocus = dock.classList.contains("tools-expanded") &&
      document.activeElement?.classList.contains("compact-secondary");
    dock.classList.remove("tools-expanded");
    more.setAttribute("aria-expanded", "false");
    if (restoreFocus && matchMedia("(max-width: 768px)").matches) more.focus();
  };
  more.addEventListener("click", () => {
    const expanded = dock.classList.toggle("tools-expanded");
    more.setAttribute("aria-expanded", String(expanded));
  });
  dock.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dock.classList.contains("tools-expanded")) {
      event.stopPropagation();
      close();
      more.focus();
    }
  });
  dock.addEventListener("click", (event) => {
    const button = (event.target as Element).closest("button");
    if (button && button !== more) close();
  });
  const compact = matchMedia("(max-width: 768px)");
  compact.addEventListener("change", close);
  document.addEventListener("pointerdown", (event) => {
    if (!dock.contains(event.target as Node)) close();
  });
}
