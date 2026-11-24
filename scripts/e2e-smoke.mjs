import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PORT = Number(process.env.E2E_PORT || 4173);
const URL = `http://127.0.0.1:${PORT}/`;

function assert(cond, message) {
  if (!cond) throw new Error(`E2E Assertion Failed: ${message}`);
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Timed out waiting for preview server at ${url}`);
}

async function launchBrowser() {
  const channels = [undefined, "chrome", "msedge"];
  let lastErr;
  for (const channel of channels) {
    try {
      return await chromium.launch({
        headless: true,
        ...(channel ? { channel } : {}),
        args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
      });
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

const server = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["vite", "preview", "--port", String(PORT), "--host", "127.0.0.1", "--strictPort"],
  { stdio: "ignore", shell: process.platform === "win32" }
);

let browser = null;

try {
  await waitForServer(URL);
  browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => typeof window.toggle4DMode === "function", { timeout: 25000 });
  await page.waitForTimeout(500);

  // 1. Help & Guide Modal tabs
  const helpVisible = await page.locator("#shortcuts-modal").isVisible();
  assert(helpVisible, "Help modal should appear on clean startup");
  const helpWelcomeText = await page.locator("#help-tab-welcome").innerText();
  assert(helpWelcomeText.includes("CasCADe Lens"), "Help welcome tab missing CasCADe Lens");
  await page.locator('.help-tab-btn[data-help-tab="tools"]').click();
  assert((await page.locator("#help-tab-tools").innerText()).includes("GAEB"), "Help tools tab missing GAEB");
  await page.locator("#btn-shortcuts-close").click();
  await page.waitForTimeout(200);

  // 2. 4D Mode + CasCADe Lens + Band Isolation
  await page.evaluate(() => window.toggle4DMode(true));
  await page.waitForTimeout(300);
  await page.locator("#btn-4d-cascade-toggle").click();
  await page.locator("#cascade-4d-panel").waitFor({ state: "visible", timeout: 5000 });
  await page.waitForFunction(
    () => (document.getElementById("cascade-indicator-select")?.options?.length || 0) > 0,
    { timeout: 5000 }
  );
  await page.selectOption("#cascade-indicator-select", "freeSlack");
  await page.selectOption("#cascade-scheme-select", "BuGn");
  await page.waitForTimeout(250);
  const bandCount = await page.locator("#cascade-legend-bands .cascade-band-chip").count();
  assert(bandCount === 5, `Expected 5 CasCADe legend bands, got ${bandCount}`);
  await page.locator("#cascade-legend-bands .cascade-band-chip").first().click();
  await page.waitForTimeout(200);
  const bandIsolated = await page
    .locator("#cascade-legend-bands .cascade-band-chip")
    .first()
    .evaluate((el) => el.classList.contains("isolated"));
  assert(bandIsolated, "Clicking CasCADe band chip did not toggle .isolated");

  // 3. WBS Gantt + Visual Rule Builder + 4D SLF Sync
  await page.locator("#btn-4d-gantt-chart").click();
  await page.waitForTimeout(300);
  assert(await page.locator("#gantt-chart-drawer").isVisible(), "Gantt drawer not visible");
  assert((await page.locator("#gantt-pane-splitter").count()) === 1, "Gantt pane splitter missing");
  await page.locator("#btn-gantt-rule-builder").click();
  await page.locator("#rule-builder-modal").waitFor({ state: "visible", timeout: 5000 });
  await page.fill("#rb-rule-name", "CI Smoke Walls");
  await page.locator("#rb-btn-save").click();
  await page.waitForTimeout(200);
  assert((await page.locator("#rb-saved-rules-list .rb-saved-item").count()) >= 1, "Saved rule not listed");
  await page.locator("#rb-btn-close").click();
  await page.locator("#btn-close-gantt-drawer").click();
  await page.locator("#btn-4d-slf-toggle").click();
  await page.waitForTimeout(300);
  assert(
    await page.locator("#btn-4d-slf-toggle").evaluate((el) => el.classList.contains("active")),
    "4D SLF toggle did not activate"
  );
  await page.evaluate(() => window.toggle4DMode(false));
  await page.waitForTimeout(250);

  // 4. Clash Drawer (Temporal 4D + SLF)
  await page.evaluate(() => document.getElementById("btn-dock-clash")?.click());
  await page.waitForTimeout(250);
  assert((await page.locator("#clash-scan-mode option").count()) === 3, "Expected 3 clash scan modes");
  await page.selectOption("#clash-scan-mode", "temporal-4d");
  await page.locator("#btn-analyze-workspace-slf").click();
  await page.locator("#clash-slf-summary").waitFor({ state: "visible", timeout: 5000 });
  assert((await page.locator("#clash-slf-summary").innerText()).includes("SLF="), "SLF summary missing");

  // 5. 5D Cost Drawer (Uniclass + Quality & BOQ Audit Drill-Down)
  await page.evaluate(() => document.getElementById("btn-dock-cost")?.click());
  await page.waitForTimeout(250);
  await page.selectOption("#drawer-cost-standard", "UNICLASS");
  await page.locator("#drawer-btn-quality-audit").click();
  await page.locator("#drawer-audit-drilldown").waitFor({ state: "visible", timeout: 5000 });
  assert((await page.locator("#drawer-btn-export-qa-csv").count()) === 1, "Export QA CSV button missing");

  // 6. Engineering Studio Civil 4.3 Vertical Profile SVG
  await page.evaluate(() => document.getElementById("btn-dock-engineering")?.click());
  await page.locator('[data-eng-tab="civil"]').waitFor({ state: "visible", timeout: 5000 });
  await page.locator('[data-eng-tab="civil"]').click({ force: true });
  await page.locator("#btn-eng-scan-civil").waitFor({ state: "visible", timeout: 5000 });
  await page.locator("#btn-eng-scan-civil").click({ force: true });
  await page.locator("#eng-civil-profile-wrap").waitFor({ state: "visible", timeout: 5000 });
  const civilDotCount = await page.locator("#eng-civil-profile-container .civil-station-dot").count();
  assert(civilDotCount >= 2, `Expected >=2 civil station dots, got ${civilDotCount}`);

  // 7. 4D Cash-Flow Histogram, Shareable Deep-Link, Workspace Snapshot & Jobsite Touch Mode
  await page.evaluate(async () => {
    await window.toggleCashFlowHistogram?.();
  });
  await page.locator("#cashflow-histogram-drawer").waitFor({ state: "visible", timeout: 5000 });
  await page.evaluate(async () => {
    await window.toggleCashFlowHistogram?.();
    await window.saveWorkspaceSnapshot?.();
  });
  const shareUrl = await page.evaluate(() => window.copyShareableViewLink?.());
  assert(typeof shareUrl === "string" && shareUrl.includes("#view="), "Shareable deep-link hash missing");
  const touchEnabled = await page.evaluate(() => window.toggleJobsiteTouchMode?.());
  assert(touchEnabled === true, "Jobsite touch mode should toggle ON");
  await page.evaluate(() => window.toggleJobsiteTouchMode?.());

  // 8. Automated All-5-Theme WCAG 2.2 AA Contrast Gate + Persona & AI Tool Call Checks
  const personaApplied = await page.evaluate(() => {
    const sel = document.getElementById("workspace-persona-select");
    if (!sel) return false;
    sel.value = "planner-4d";
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    return document.body.dataset.persona === "planner-4d";
  });
  assert(personaApplied, "Workspace persona switcher failed to apply planner-4d");

  const aiResp = await page.evaluate(() => window.runStructuredBimAiQuery?.("Show me a 3-week lookahead"));
  assert(aiResp && aiResp.tool === "runLookahead", "Structured AI tool-calling router failed");

  const themeContrastResults = await page.evaluate(async () => {
    const parseRgb = (str) => {
      const m = (str || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!m) return null;
      return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] === undefined ? 1 : Number(m[4]) };
    };
    const relLum = ({ r, g, b }) => {
      const lin = [r, g, b].map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
    };
    const contrast = (fg, bg) => {
      const l1 = relLum(fg);
      const l2 = relLum(bg);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };
    const effectiveBg = (el) => {
      let cur = el;
      while (cur && cur !== document.documentElement) {
        const bg = parseRgb(getComputedStyle(cur).backgroundColor);
        if (bg && bg.a >= 0.75) return bg;
        cur = cur.parentElement;
      }
      return parseRgb(getComputedStyle(document.body).backgroundColor) || { r: 15, g: 23, b: 42, a: 1 };
    };

    const themes = ["dark", "light-studio", "zen", "cyberpunk", "blueprint"];
    const out = [];
    for (const t of themes) {
      document.documentElement.setAttribute("data-theme", t);
      await new Promise((r) => requestAnimationFrame(r));
      const targets = [
        document.querySelector(".schedule-widget .sequence-box-title"),
        document.querySelector(".timeline-controls-row .btn-timeline-csv"),
        document.querySelector("#viewport-4d-hud .hud-4d-active-tasks"),
      ].filter(Boolean);
      let minRatio = 99;
      for (const el of targets) {
        const fg = parseRgb(getComputedStyle(el).color);
        const bg = effectiveBg(el);
        if (fg && bg) {
          minRatio = Math.min(minRatio, contrast(fg, bg));
        }
      }
      out.push({ theme: t, minContrastRatio: Math.round(minRatio * 100) / 100 });
    }
    document.documentElement.setAttribute("data-theme", "dark");
    return out;
  });

  for (const r of themeContrastResults) {
    assert(
      r.minContrastRatio >= 4.5,
      `WCAG AA contrast failed on theme "${r.theme}": min ratio ${r.minContrastRatio} < 4.5`
    );
  }

  // 9. Multi-Viewport Responsive Checks (Tablet 768x1024 & Mobile 390x844)
  for (const vp of [
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(200);
    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 4
    );
    assert(!overflowX, `Unexpected horizontal overflow on ${vp.name} (${vp.width}x${vp.height})`);
  }

  assert(consoleErrors.length === 0, `Console errors detected: ${consoleErrors.join(" | ")}`);
  assert(pageErrors.length === 0, `Page errors detected: ${pageErrors.join(" | ")}`);

  console.log(
    JSON.stringify(
      {
        status: "PASSED",
        bandCount,
        civilDotCount,
        deepLinkVerified: true,
        themeContrastResults,
        multiViewportVerified: ["1440x900", "768x1024", "390x844"],
        consoleErrorCount: consoleErrors.length,
        pageErrorCount: pageErrors.length,
      },
      null,
      2
    )
  );
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server && !server.killed) {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" });
    } else {
      server.kill("SIGTERM");
    }
  }
}
