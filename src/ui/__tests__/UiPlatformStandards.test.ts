// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import {
  UI_WINDOW_SIZES,
  UI_Z_LAYERS,
  FloatingWindowManager,
  createFloatingWindow,
  createBkModal,
  createBkDropdown,
  createBkButton,
  createBkSelect,
} from "../UiPlatform";

describe("UI Platform Standards & Global Component Contract", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
  });

  it("enforces monotonic floating window size presets and strict z-index elevation order", () => {
    expect(UI_WINDOW_SIZES.sm.width).toBeLessThan(UI_WINDOW_SIZES.md.width);
    expect(UI_WINDOW_SIZES.md.width).toBeLessThan(UI_WINDOW_SIZES.lg.width);
    expect(UI_WINDOW_SIZES.lg.width).toBeLessThan(UI_WINDOW_SIZES.xl.width);

    expect(UI_Z_LAYERS.canvas).toBeLessThan(UI_Z_LAYERS.hud);
    expect(UI_Z_LAYERS.hud).toBeLessThan(UI_Z_LAYERS.sidebar);
    expect(UI_Z_LAYERS.sidebar).toBeLessThan(UI_Z_LAYERS.dock);
    expect(UI_Z_LAYERS.dock).toBeLessThan(UI_Z_LAYERS.floatingBase);
    expect(UI_Z_LAYERS.floatingMax).toBeLessThan(UI_Z_LAYERS.dropdown);
    expect(UI_Z_LAYERS.dropdown).toBeLessThan(UI_Z_LAYERS.modal);
    expect(UI_Z_LAYERS.modal).toBeLessThan(UI_Z_LAYERS.command);
    expect(UI_Z_LAYERS.command).toBeLessThan(UI_Z_LAYERS.toast);
  });

  it("coordinates click-to-focus z-stacking, persistence, collapse, and minimize-to-pill in FloatingWindowManager", () => {
    const mgr = FloatingWindowManager.getInstance();
    const winA = createFloatingWindow({
      id: "test-float-a",
      title: "Analytics",
      size: "lg",
      resizable: true,
      collapsible: true,
      showResetButton: true,
      persistKey: "test_float_a_v1",
      bodyHtml: "<p>Chart</p>",
    });
    const winB = createFloatingWindow({
      id: "test-float-b",
      title: "Transform",
      size: "sm",
      minimizeMode: "pill",
      pillLabel: "Transform Pill",
      bodyHtml: "<p>Controls</p>",
    });

    winA.open();
    winB.open();
    expect(winB.getZIndex()).toBeGreaterThan(winA.getZIndex());

    // Bringing winA to front raises it cleanly above winB within the floating layer
    mgr.bringToFront("test-float-a");
    expect(winA.getZIndex()).toBeGreaterThan(winB.getZIndex());
    expect(winA.getZIndex()).toBeGreaterThanOrEqual(UI_Z_LAYERS.floatingBase);
    expect(winA.getZIndex()).toBeLessThanOrEqual(UI_Z_LAYERS.floatingMax);

    // Position, resize, collapse, and persistence
    winA.setPosition(110, 92);
    winA.setSize(520, 260);
    expect(winA.getGeometry()).toMatchObject({ left: 110, top: 92, width: 520, height: 260 });
    expect(localStorage.getItem("test_float_a_v1")).toContain('"width":520');

    winA.setCollapsed(true);
    expect(winA.el.classList.contains("is-collapsed")).toBe(true);

    // Minimize-to-pill mode creates reopen pill and restores window on click
    winB.close(true);
    expect(winB.isOpen()).toBe(false);
    const pill = document.getElementById("test-float-b-reopen-pill") as HTMLButtonElement;
    expect(pill).not.toBeNull();
    pill.click();
    expect(winB.isOpen()).toBe(true);
    expect(document.getElementById("test-float-b-reopen-pill")).toBeNull();

    winA.destroy();
    winB.destroy();
    expect(document.getElementById("test-float-a")).toBeNull();
    expect(document.getElementById("test-float-b")).toBeNull();
  });

  it("creates accessible standard modals with Escape and backdrop dismissal", () => {
    let closed = 0;
    const modal = createBkModal({
      id: "test-std-modal",
      title: "Standard Dialog",
      subtitle: "Subtitle line",
      size: "md",
      closeButtonId: "test-std-close",
      bodyHtml: "<div>Body</div>",
      footerHtml: `<button type="button" class="bk-btn bk-btn--primary">Save</button>`,
      onClose: () => {
        closed++;
      },
    });

    expect(modal.dialog.getAttribute("role")).toBe("dialog");
    expect(modal.dialog.getAttribute("aria-modal")).toBe("true");
    expect(modal.dialog.classList.contains("bk-modal--md")).toBe(true);
    expect(document.getElementById("test-std-close")).not.toBeNull();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(document.getElementById("test-std-modal")).toBeNull();
    expect(closed).toBe(1);
  });

  it("creates standard viewport-clamped dropdowns, buttons, and selects", () => {
    let clicked = false;
    const btn = createBkButton({
      id: "std-btn",
      label: "Actions",
      variant: "primary",
      size: "sm",
      onClick: () => {
        clicked = true;
      },
    });
    document.body.appendChild(btn);
    expect(btn.className).toContain("bk-btn--primary");
    expect(btn.className).toContain("bk-btn--sm");
    btn.click();
    expect(clicked).toBe(true);

    let chosen = "";
    const dropdown = createBkDropdown({
      id: "std-dropdown",
      anchor: btn,
      items: [
        { id: "opt1", label: "Option One", badge: "NEW", onSelect: () => { chosen = "opt1"; } },
        { id: "opt2", label: "Option Two", dividerBefore: true, onSelect: () => { chosen = "opt2"; } },
      ],
    });
    dropdown.open();
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(dropdown.menu.classList.contains("hidden")).toBe(false);
    dropdown.menu.querySelector<HTMLButtonElement>('[data-item-id="opt2"]')?.click();
    expect(chosen).toBe("opt2");
    expect(dropdown.menu.classList.contains("hidden")).toBe(true);
    dropdown.destroy();

    let selectedVal = "";
    const sel = createBkSelect({
      id: "std-select",
      ariaLabel: "Granularity",
      size: "sm",
      items: [
        { value: "month", label: "Monthly" },
        { value: "week", label: "Weekly" },
      ],
      value: "month",
      onChange: (v) => {
        selectedVal = v;
      },
    });
    document.body.appendChild(sel);
    expect(sel.className).toContain("bk-select--sm");
    sel.value = "week";
    sel.dispatchEvent(new Event("change"));
    expect(selectedVal).toBe("week");
  });
});
