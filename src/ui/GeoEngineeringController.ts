import { GisModule } from "../modules/GisModule";
import {
  GeoEngineeringSuite,
  GisTileCache,
  computeSunPath,
  computeDaylight,
  dayOfYearFromDate,
  buildStandaloneIfcGeoreference,
  injectGeoreferencingIntoIfc,
  parseSurveyCsv,
  computeDiscrepancies,
  summarizeDiscrepancies,
  discrepanciesToCsv,
  type IfcGeoreferenceParams,
  type SurveyFieldPoint,
} from "../modules/GeoEngineeringSuite";
import { SoundManager } from "../core/SoundManager";
import { showToast } from "./ToastManager";
import { escapeHtml } from "../utils/formatters";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;

function download(name: string, text: string, mime = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const fmtHour = (h: number) => {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm === 60 ? 0 : mm).padStart(2, "0")}`;
};

export function initGeoEngineeringController(world: any, fragmentsCore?: any) {
  if (typeof document === "undefined") return;
  const gis = GisModule.getInstance();
  const suite = GeoEngineeringSuite.getInstance();
  suite.init(world, fragmentsCore);
  const click = () => {
    try { SoundManager.getInstance().playClick(); } catch { /* noop */ }
  };

  // ======================= 1. SOLAR =======================
  const dateInput = $<HTMLInputElement>("geo-sun-date");
  const hourInput = $<HTMLInputElement>("geo-sun-hour");
  const pathToggle = $<HTMLInputElement>("geo-sun-path-toggle");
  const today = new Date();
  if (dateInput) dateInput.value = today.toISOString().slice(0, 10);

  const syncSite = () => {
    const loc = gis.getLocation();
    suite.setSunSite(loc.latitude, loc.longitude, loc.trueNorthAngle || 0);
  };

  const updateSunUI = (sun: { azimuth: number; elevation: number }, hour: number) => {
    const s = suite.sunState;
    const dl = computeDaylight(computeSunPath(s.lat, s.lon, s.dayOfYear, 0.1, s.utcOffset));
    const r = $("geo-sun-readout");
    if (r) {
      r.innerHTML =
        `Azimuth <b>${sun.azimuth.toFixed(1)}°</b> · Elevation <b>${sun.elevation.toFixed(1)}°</b><br/>` +
        (dl.sunrise !== null
          ? `Sunrise ${fmtHour(dl.sunrise)} · Sunset ${fmtHour(dl.sunset!)} · Daylight ${dl.hours.toFixed(1)} h (UTC${s.utcOffset >= 0 ? "+" : ""}${s.utcOffset})`
          : "Polar night — sun below horizon all day");
    }
    const hv = $("geo-sun-hour-val");
    if (hv) hv.textContent = fmtHour(hour);
    const badge = $("geo-sun-badge");
    if (badge) badge.textContent = sun.elevation > 0 ? `☀ ${sun.elevation.toFixed(0)}°` : "Night";
  };

  const refreshSun = (apply: boolean) => {
    syncSite();
    const d = dateInput?.value ? new Date(dateInput.value + "T12:00:00") : new Date();
    suite.sunState.dayOfYear = dayOfYearFromDate(d);
    suite.sunState.hour = Number(hourInput?.value ?? 12);
    const sun = apply ? suite.applySun() : suite.getSunNow();
    if (!apply && pathToggle?.checked) suite.drawSunPath(true);
    if (!pathToggle?.checked && !suite.isPlayingDayCycle()) suite.hideSunPath();
    updateSunUI(sun, suite.sunState.hour);
    return sun;
  };

  hourInput?.addEventListener("input", () => {
    if (suite.isPlayingDayCycle()) {
      suite.stopDayCycle();
      const playBtn = $("geo-sun-play");
      if (playBtn) playBtn.textContent = "▶ Play Day Cycle";
    }
    refreshSun(true);
  });
  dateInput?.addEventListener("change", () => refreshSun(true));
  pathToggle?.addEventListener("change", () => { refreshSun(false); click(); });
  document.querySelectorAll<HTMLButtonElement>(".geo-sun-preset").forEach((b) =>
    b.addEventListener("click", () => {
      if (dateInput) dateInput.value = `${new Date().getFullYear()}-${b.dataset.date}`;
      refreshSun(true);
      click();
    })
  );
  $("geo-sun-apply")?.addEventListener("click", () => {
    const sun = refreshSun(true);
    showToast(`Sun applied: Az ${sun.azimuth.toFixed(1)}°, El ${sun.elevation.toFixed(1)}°`, "success");
    click();
  });
  $("geo-sun-play")?.addEventListener("click", (e) => {
    syncSite();
    const btn = e.currentTarget as HTMLButtonElement;
    const playing = suite.playDayCycle((hour, sun) => {
      if (hourInput) {
        hourInput.value = hour.toFixed(2);
      }
      updateSunUI(sun, hour);
    });
    btn.textContent = playing ? "■ Stop Cycle" : "▶ Play Day Cycle";
    if (playing) {
      if (pathToggle && !pathToggle.checked) {
        pathToggle.checked = true;
      }
      showToast("Day cycle playing — sun and shadows animating", "info");
    } else {
      showToast("Day cycle stopped", "info");
    }
    click();
  });

  // ======================= 2. SECTION BOX =======================
  const boxToggle = $<HTMLInputElement>("geo-box-toggle");
  const sliders = Array.from(document.querySelectorAll<HTMLInputElement>("#geo-box-sliders input[type=range]"));
  const boxReadout = () => {
    const b = suite.sectionBox;
    const r = $("geo-box-readout");
    if (r) {
      const s = b.getSize(new (b.min.constructor as any)());
      r.textContent = `Box ${s.x.toFixed(1)} × ${s.y.toFixed(1)} × ${s.z.toFixed(1)} m · Y ${b.min.y.toFixed(2)} → ${b.max.y.toFixed(2)}`;
    }
    const badge = $("geo-box-badge");
    if (badge) badge.textContent = suite.sectionBoxEnabled ? "On" : "Off";
  };
  const resetSliders = () => sliders.forEach((s) => (s.value = s.dataset.side === "min" ? "0" : "1"));
  boxToggle?.addEventListener("change", () => {
    const on = !!boxToggle.checked;
    if (on) { suite.fitSectionBoxToModel(); resetSliders(); }
    suite.setSectionBoxEnabled(on);
    $("geo-box-sliders")?.classList.toggle("active", on);
    boxReadout();
    click();
  });
  sliders.forEach((s) =>
    s.addEventListener("input", () => {
      suite.setSectionBoxFraction(s.dataset.axis as any, s.dataset.side as any, Number(s.value));
      boxReadout();
    })
  );
  $("geo-box-fit")?.addEventListener("click", () => {
    suite.fitSectionBoxToModel();
    resetSliders();
    boxReadout();
    click();
  });
  $("geo-box-reset")?.addEventListener("click", () => {
    if (boxToggle) boxToggle.checked = false;
    suite.setSectionBoxEnabled(false);
    $("geo-box-sliders")?.classList.remove("active");
    resetSliders();
    boxReadout();
    click();
  });

  // ======================= 3. TERRAIN =======================
  const exag = $<HTMLInputElement>("geo-terrain-exag");
  exag?.addEventListener("input", () => {
    const v = $("geo-terrain-exag-val");
    if (v) v.textContent = `${Number(exag.value).toFixed(1)}×`;
  });
  const buildTerrain = async () => {
    const loc = gis.getLocation();
    const cfg = gis.getBasemapConfig();
    const badge = $("geo-terrain-badge");
    if (badge) badge.textContent = "Loading…";
    const info = await suite.buildTerrain({
      lat: loc.latitude,
      lon: loc.longitude,
      radius: Math.min(cfg.radius || 400, 2000),
      exaggeration: Number(exag?.value ?? 1),
      contourInterval: Number(($<HTMLInputElement>("geo-terrain-contour"))?.value ?? 2),
    });
    if (badge) badge.textContent = info.source === "dem" ? "DEM" : "Procedural";
    const r = $("geo-terrain-readout");
    if (r) {
      r.innerHTML = `Source: <b>${info.source === "dem" ? "Terrarium DEM (AWS Open Data)" : "Procedural fallback (offline)"}</b><br/>` +
        `Relief ${info.min.toFixed(1)} → ${info.max.toFixed(1)} m · ${info.size}×${info.size} grid · ${(info.radius * 2).toFixed(0)} m extent`;
    }
    showToast(`Terrain built (${info.source.toUpperCase()}) · relief ${(info.max - info.min).toFixed(1)} m`, "success");
  };
  $("geo-terrain-build")?.addEventListener("click", () => { click(); buildTerrain(); });
  $("geo-terrain-remove")?.addEventListener("click", () => {
    suite.removeTerrain();
    const badge = $("geo-terrain-badge");
    if (badge) badge.textContent = "None";
    const r = $("geo-terrain-readout");
    if (r) r.textContent = "Generate terrain to compute cut / fill.";
    click();
  });
  $("geo-terrain-cutfill")?.addEventListener("click", () => {
    const pad = Number(($<HTMLInputElement>("geo-terrain-pad"))?.value ?? 0);
    const res = suite.computeFootprintCutFill(pad);
    const r = $("geo-terrain-readout");
    if (!res) {
      showToast("Build terrain first", "warning");
      return;
    }
    if (r) {
      r.innerHTML += `<br/>Pad ${pad.toFixed(2)} m · Cut <b style="color:var(--color-danger)">${res.cut.toFixed(0)} m³</b> · Fill <b style="color:var(--color-success)">${res.fill.toFixed(0)} m³</b> · Net ${res.net >= 0 ? "+" : ""}${res.net.toFixed(0)} m³ (${res.cells} cells)`;
    }
    click();
  });

  // ======================= 4. IFC GEOREF =======================
  const geoParams = (): IfcGeoreferenceParams => {
    const loc = gis.getLocation();
    const utm = gis.toUtm(loc.latitude, loc.longitude);
    const zoneNum = parseInt(utm.zone, 10);
    const north = loc.latitude >= 0;
    return {
      eastings: utm.easting,
      northings: utm.northing,
      orthogonalHeight: loc.elevationAMSL,
      trueNorthDeg: loc.trueNorthAngle || 0,
      crsName: `EPSG:${north ? 326 : 327}${String(zoneNum).padStart(2, "0")}`,
      mapZone: utm.zone,
      latitude: loc.latitude,
      longitude: loc.longitude,
    };
  };
  const ifcReadout = () => {
    const p = geoParams();
    const r = $("geo-ifc-readout");
    if (r) r.innerHTML = `${p.crsName} · Zone ${escapeHtml(p.mapZone || "")}<br/>E ${p.eastings.toFixed(3)} · N ${p.northings.toFixed(3)} · H ${p.orthogonalHeight.toFixed(2)} · TN ${p.trueNorthDeg.toFixed(2)}°`;
  };
  ifcReadout();
  let ifcSource: { name: string; text: string } | null = null;
  $<HTMLInputElement>("geo-ifc-file")?.addEventListener("change", async (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    ifcSource = { name: f.name, text: await f.text() };
    showToast(`Loaded ${f.name} for georeference injection`, "info");
  });
  $("geo-ifc-export")?.addEventListener("click", () => {
    const p = geoParams();
    ifcReadout();
    if (ifcSource) {
      download(ifcSource.name.replace(/\.ifc$/i, "") + "_georef.ifc", injectGeoreferencingIntoIfc(ifcSource.text, p));
      showToast("IfcMapConversion injected into IFC", "success");
    } else {
      download("site_georeference.ifc", buildStandaloneIfcGeoreference(p));
      showToast("IFC4 georeference file exported", "success");
    }
    click();
  });
  $("geo-ifc-json")?.addEventListener("click", () => {
    const p = geoParams();
    download("site_georeference.json", JSON.stringify({ schema: "IFC4", IfcMapConversion: p }, null, 2), "application/json");
    click();
  });

  // ======================= 5. DISCREPANCY =======================
  const designPoints = (): SurveyFieldPoint[] =>
    gis.getSurveyPoints().map((p) => ({ id: p.id, x: p.localX, y: p.localY, z: p.localZ }));
  const tol = () => ({
    passMm: Number(($<HTMLInputElement>("geo-tol-pass"))?.value || 15),
    warnMm: Number(($<HTMLInputElement>("geo-tol-warn"))?.value || 30),
  });
  const runDiscrepancy = (field: SurveyFieldPoint[]) => {
    const list = computeDiscrepancies(designPoints(), field, tol());
    if (!list.length) {
      showToast("No matching point IDs between field data and Survey GCPs", "warning");
      return;
    }
    suite.showDiscrepancies(list);
    const s = summarizeDiscrepancies(list);
    const sum = $("geo-disc-summary");
    if (sum) sum.innerHTML = `<span style="color:var(--color-success)">${s.pass} pass</span> · <span style="color:var(--color-warning)">${s.warn} warn</span> · <span style="color:var(--color-danger)">${s.fail} fail</span><br/>RMS ${s.rmsMm.toFixed(1)} mm · Max ${s.maxMm.toFixed(1)} mm`;
    const badge = $("geo-disc-badge");
    if (badge) badge.textContent = `${s.count} pts`;
    const listEl = $("geo-disc-list");
    if (listEl) {
      listEl.innerHTML = list
        .map(
          (d) => `<div class="geo-disc-item ${d.status}" data-id="${escapeHtml(d.id)}" title="ΔX ${(d.dx * 1000).toFixed(1)} · ΔY ${(d.dy * 1000).toFixed(1)} · ΔZ ${(d.dz * 1000).toFixed(1)} mm">
            <span class="geo-disc-dot"></span><span>${escapeHtml(d.id)}</span><span class="geo-disc-mm">${(d.ds * 1000).toFixed(1)} mm</span></div>`
        )
        .join("");
      listEl.querySelectorAll<HTMLElement>(".geo-disc-item").forEach((el) =>
        el.addEventListener("click", () => {
          const d = list.find((x) => x.id === el.dataset.id);
          const c = world?.camera?.controls;
          if (d && c?.setLookAt) c.setLookAt(d.design.x + 6, d.design.y + 5, d.design.z + 6, d.design.x, d.design.y, d.design.z, true);
        })
      );
    }
  };
  $<HTMLInputElement>("geo-disc-file")?.addEventListener("change", async (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const pts = parseSurveyCsv(await f.text());
    showToast(`Parsed ${pts.length} field points from ${f.name}`, "info");
    runDiscrepancy(pts);
  });
  $("geo-disc-demo")?.addEventListener("click", () => {
    const rnd = (s: number) => (Math.random() - 0.5) * 2 * s;
    const field = designPoints().map((p, i) => {
      const mag = [0.008, 0.022, 0.045][i % 3];
      return { id: p.id, x: p.x + rnd(mag), y: p.y + rnd(mag * 0.6), z: p.z + rnd(mag) };
    });
    runDiscrepancy(field);
    click();
  });
  $("geo-disc-export")?.addEventListener("click", () => {
    if (!suite.discrepancies.length) return showToast("No discrepancy data", "warning");
    download("survey_discrepancy_report.csv", discrepanciesToCsv(suite.discrepancies), "text/csv");
    click();
  });
  $("geo-disc-clear")?.addEventListener("click", () => {
    suite.clearDiscrepancies();
    const listEl = $("geo-disc-list");
    if (listEl) listEl.innerHTML = "";
    const sum = $("geo-disc-summary");
    if (sum) sum.textContent = "Compared against Survey GCPs.";
    const badge = $("geo-disc-badge");
    if (badge) badge.textContent = "0 pts";
    click();
  });

  // ======================= 6. WALKTHROUGH =======================
  const walkBtn = $<HTMLButtonElement>("geo-walk-toggle");
  const setWalkUi = (on: boolean) => {
    if (walkBtn) {
      walkBtn.textContent = on ? "Exit Walkthrough (Esc)" : "Start Walkthrough";
      walkBtn.classList.toggle("active", on);
    }
    const badge = $("geo-walk-badge");
    if (badge) badge.textContent = on ? "Walking" : "Idle";
  };
  const speed = $<HTMLInputElement>("geo-walk-speed");
  speed?.addEventListener("input", () => {
    suite.walkConfig.speed = Number(speed.value);
    const v = $("geo-walk-speed-val");
    if (v) v.textContent = `${Number(speed.value).toFixed(1)} m/s`;
  });
  $<HTMLInputElement>("geo-walk-eye")?.addEventListener("change", (e) => {
    suite.walkConfig.eyeHeight = Math.max(0.5, Number((e.target as HTMLInputElement).value) || 1.65);
  });
  $<HTMLInputElement>("geo-walk-collision")?.addEventListener("change", (e) => {
    suite.walkConfig.collision = (e.target as HTMLInputElement).checked;
  });
  walkBtn?.addEventListener("click", () => {
    if (suite.walkActive) {
      suite.stopWalkthrough();
      setWalkUi(false);
    } else if (suite.startWalkthrough(() => setWalkUi(false))) {
      setWalkUi(true);
      showToast("Walkthrough: WASD to move, click viewport for mouse-look, Esc to exit", "info");
    }
    click();
  });

  // ======================= 7. OFFLINE CACHE =======================
  const refreshCache = async () => {
    const s = await GisTileCache.stats();
    const mb = (s.bytes / 1048576).toFixed(2);
    const r = $("geo-cache-readout");
    if (r) r.textContent = `${s.count} tiles cached · ${mb} MB · ${GisTileCache.enabled ? "caching on" : "caching off"}`;
    const b = $("geo-cache-badge");
    if (b) b.textContent = `${s.count} tiles`;
  };
  $<HTMLInputElement>("geo-cache-toggle")?.addEventListener("change", (e) => {
    GisTileCache.enabled = (e.target as HTMLInputElement).checked;
    refreshCache();
    click();
  });
  $("geo-cache-refresh")?.addEventListener("click", () => { refreshCache(); click(); });
  $("geo-cache-clear")?.addEventListener("click", async () => {
    await GisTileCache.clear();
    refreshCache();
    showToast("Offline tile cache cleared", "info");
    click();
  });

  // Initial UI state
  refreshSun(false);
  suite.hideSunPath();
  boxReadout();
  refreshCache();
}

