// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { AppStateStore } from "../../core/AppStateStore";
import { EditHistoryManager } from "../../core/EditHistoryManager";
import { GpuPerformanceMonitor } from "../../core/GpuPerformanceMonitor";
import { WorkspacePersonaManager } from "../../ui/WorkspacePersonaManager";
import { computeLookaheadReport, exportLookaheadCsv } from "../LookaheadEngine";
import { simulateTaskDelayScenario } from "../WhatIfScenarioEngine";
import { EquipmentEnvelopeSimulator } from "../EquipmentEnvelopeSimulator";
import { searchOfflineBsddCatalog, searchBsddClasses } from "../BsddClient";
import { parsePromptToToolCall, executeGroundedToolCall } from "../AiToolCallEngine";
import {
  RealtimeCollaborationBridge,
  type CollabMessage,
} from "../RealtimeCollaborationBridge";
import { ScheduleTimelineController } from "../../ui/ScheduleTimelineController";
import type { ScheduleTask } from "../ScheduleManager";

function makeTask(partial: Partial<ScheduleTask> & { id: string; name: string }): ScheduleTask {
  return {
    id: partial.id,
    name: partial.name,
    startDate: partial.startDate ?? "2026-06-01",
    endDate: partial.endDate ?? "2026-06-10",
    status: partial.status ?? "Planned",
    modelId: partial.modelId ?? "m1",
    elementIds: partial.elementIds ?? new Set<number>([1]),
    unitCost: partial.unitCost ?? 1000,
    totalCost: partial.totalCost ?? 15000,
    quantity: partial.quantity ?? 1,
    isSummary: partial.isSummary ?? false,
    predecessors: partial.predecessors,
    delayDays: partial.delayDays,
  } as ScheduleTask;
}

describe("Enterprise Standards Suite — Reactive State, Undo/Redo, GPU, Personas, Lookahead, What-If, Crane, bSDD, AI Tools, Realtime & XSS", () => {
  it("notifies subscribers deterministically in AppStateStore", () => {
    const store = AppStateStore.getInstance();
    store.reset();
    const events: string[][] = [];
    const unsub = store.subscribe((_next, _prev, changed) => events.push([...changed]));
    store.setState({ is4dMode: true, workspacePersona: "planner-4d" });
    store.setState({ is4dMode: true }); // no-op change should not notify
    unsub();
    expect(events).toEqual([["is4dMode", "workspacePersona"]]);
    expect(store.getState().workspacePersona).toBe("planner-4d");
  });

  it("executes, undoes, and redoes reversible commands in EditHistoryManager", async () => {
    const hist = EditHistoryManager.getInstance();
    hist.clear();
    let value = 10;
    await hist.execute({
      id: "shift-1",
      label: "Shift +14d",
      apply: () => { value = 24; },
      revert: () => { value = 10; },
    });
    expect(value).toBe(24);
    expect(hist.canUndo()).toBe(true);

    await hist.undo();
    expect(value).toBe(10);
    expect(hist.canRedo()).toBe(true);

    await hist.redo();
    expect(value).toBe(24);
    expect(hist.getStackSizes()).toEqual({ undo: 1, redo: 0 });
  });

  it("disposes Three.js Object3D geometries and materials cleanly via GpuPerformanceMonitor", () => {
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()));
    const disposed = GpuPerformanceMonitor.disposeObject3D(grp);
    expect(disposed).toBeGreaterThanOrEqual(2);
  });

  it("switches Workspace Personas and updates body[data-persona] + touch mode", () => {
    const mgr = WorkspacePersonaManager.getInstance();
    mgr.applyPersona("field", false);
    expect(document.body.dataset.persona).toBe("field");
    expect(document.body.classList.contains("jobsite-touch-mode")).toBe(true);
    mgr.applyPersona("all", false);
    expect(document.body.dataset.persona).toBe("all");
  });

  it("computes 3-week construction lookahead buckets and valid CSV export", () => {
    const anchorMs = new Date("2026-06-15").getTime();
    const tasks = [
      makeTask({ id: "1", name: "FOU_EPit", startDate: "2026-06-01", endDate: "2026-06-10", elementIds: new Set([1]) }),
      makeTask({ id: "2", name: "COL_LL1", startDate: "2026-06-14", endDate: "2026-06-20", elementIds: new Set([2]) }),
      makeTask({ id: "3", name: "FLO_LL1", startDate: "2026-06-25", endDate: "2026-07-02", elementIds: new Set([3]) }),
      makeTask({ id: "4", name: "ROOF_Top", startDate: "2026-08-01", endDate: "2026-08-15", elementIds: new Set([4]) }),
    ];

    const report = computeLookaheadReport(tasks, anchorMs, 3);
    expect(report.completedTasks).toHaveLength(1);
    expect(report.thisWeekTasks).toHaveLength(1);
    expect(report.lookaheadTasks).toHaveLength(1);
    expect(report.futureTasks).toHaveLength(1);

    const csv = exportLookaheadCsv(report);
    expect(csv).toContain("THIS_WEEK,2,COL_LL1");
    expect(csv).toContain("NEXT_3_WEEKS,3,FLO_LL1");
  });

  it("simulates cascading What-If delay slippage and cost delta without mutating baseline", () => {
    const tasks = [
      makeTask({ id: "A", name: "FOU_EPit", startDate: "2026-06-01", endDate: "2026-06-10", totalCost: 50000 }),
      makeTask({
        id: "B",
        name: "COL_LL1",
        startDate: "2026-06-11",
        endDate: "2026-06-20",
        totalCost: 80000,
        predecessors: [{ predecessorId: "A", type: "FS", lagDays: 0 }],
      }),
    ];

    const sim = simulateTaskDelayScenario(tasks, "A", 14, new Date("2026-06-15").getTime(), true);
    expect(sim.affectedTaskCount).toBe(2);
    expect(sim.projectSlipDays).toBe(14);
    expect(sim.baselineEndDate).toBe("2026-06-20");
    expect(sim.simulatedEndDate).toBe("2026-07-04");
    // Baseline tasks must remain unmutated
    expect(tasks[0].actualEndDate).toBeUndefined();
  });

  it("mounts, slews, checks clearance, and cleanly disposes 4D Tower Crane Safety Envelope", () => {
    const scene = new THREE.Scene();
    const crane = EquipmentEnvelopeSimulator.getInstance();
    const bounds = new THREE.Box3(new THREE.Vector3(-10, 0, -10), new THREE.Vector3(10, 20, 10));

    crane.mount(scene, bounds);
    expect(crane.isActive()).toBe(true);
    expect(scene.children.length).toBe(1);

    const okStatus = crane.updateForTimelineRatio(0.5, 20);
    expect(okStatus.clearanceOk).toBe(true);
    expect(okStatus.slewAngleDeg).toBe(0);

    const clashStatus = crane.updateForTimelineRatio(0.25, 31);
    expect(clashStatus.clearanceOk).toBe(false);

    crane.dispose(scene);
    expect(crane.isActive()).toBe(false);
    expect(scene.children.length).toBe(0);
  });

  it("queries offline IFC 4.3 bSDD catalog and handles non-network lookup cleanly", async () => {
    const offline = searchOfflineBsddCatalog("IfcColumn");
    expect(offline).toHaveLength(1);
    expect(offline[0].recommendedPsets).toContain("Pset_ColumnCommon");

    const results = await searchBsddClasses("IfcWall", { allowNetwork: false });
    expect(results[0].code).toBe("IfcWall");
  });

  it("routes natural-language and JSON LLM tool calls deterministically in AiToolCallEngine", () => {
    const call1 = parsePromptToToolCall("Why is SPI dropping right now?");
    expect(call1?.tool).toBe("explainSpiDrop");

    const call2 = parsePromptToToolCall("Show me a 4-week lookahead");
    expect(call2).toEqual({ tool: "runLookahead", args: { weeks: 4 } });

    const call3 = parsePromptToToolCall('{"tool":"simulateDelay","args":{"delayDays":10}}');
    expect(call3).toEqual({ tool: "simulateDelay", args: { delayDays: 10 } });

    const tasks = [
      makeTask({ id: "1", name: "FOU_EPit", startDate: "2026-06-01", endDate: "2026-06-10", delayDays: 5 }),
    ];
    const resp = executeGroundedToolCall(call1!, { tasks, evalDateMs: new Date("2026-06-12").getTime() });
    expect(resp.summary).toContain("FOU_EPit");
    expect(resp.culpritTaskIds).toContain("1");
  });

  it("synchronizes peer presence and timeline events across RealtimeCollaborationBridge", () => {
    const sent: CollabMessage[] = [];
    let receivedDate = 0;
    const bridge = RealtimeCollaborationBridge.getInstance();
    bridge.disconnect();
    bridge.connect({
      displayName: "Lead Engineer",
      transport: {
        postMessage: (m) => sent.push(m),
        close: () => {},
      },
      handlers: {
        onRemoteTimeline: (_peer, dateMs) => {
          receivedDate = dateMs;
        },
      },
    });

    bridge.handleIncoming({
      type: "hello",
      peer: { peerId: "remote-1", displayName: "Site Super", role: "Field", lastSeenMs: Date.now() },
    });
    expect(bridge.getPeers()).toHaveLength(1);

    bridge.handleIncoming({ type: "timeline", peerId: "remote-1", dateMs: 1782000000000, is4dMode: true });
    expect(receivedDate).toBe(1782000000000);

    bridge.disconnect();
    expect(bridge.isConnected()).toBe(false);
    expect(sent.some((m) => m.type === "hello")).toBe(true);
  });

  it("escapes untrusted XSS payloads in ScheduleTimelineController task cards (OWASP)", () => {
    document.body.innerHTML = `<div id="schedule-tasks-list"></div>`;
    const ctrl = new ScheduleTimelineController({ onTaskClick: () => {} });
    ctrl.render(
      [
        [
          '1::<img src=x onerror="window.__xss=1">FOU_Bad',
          {
            startDate: "2026-06-01",
            endDate: "2026-06-10",
            totalCount: 5,
            completedCount: 1,
            modelIdMaps: {},
          },
        ],
      ],
      new Date("2026-06-05"),
      true
    );
    const list = document.getElementById("schedule-tasks-list")!;
    expect(list.querySelector("img")).toBeNull();
    expect(list.textContent).toContain("<img src=x");
  });
});
