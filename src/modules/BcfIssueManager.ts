import * as THREE from "three";
import * as OBC from "@thatopen/components";
import { BimEngine } from "../core/BimEngine";
import { SoundManager } from "../core/SoundManager";

export type BcfPriority = "Critical" | "Major" | "Normal" | "Minor";
export type BcfStatus = "Open" | "In Review" | "Resolved" | "Closed";

export interface BcfViewpoint {
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
  selectedElementGuids: string[];
}

export interface BcfTopic {
  guid: string;
  topicType: string;
  topicStatus: BcfStatus;
  priority: BcfPriority;
  title: string;
  description: string;
  creationDate: string;
  creationAuthor: string;
  assignedTo?: string;
  viewpoint: BcfViewpoint;
  redlinePoints?: { x: number; y: number }[];
}

export class BcfIssueManager {
  private static instance: BcfIssueManager | null = null;
  private engine: BimEngine;
  private topics: BcfTopic[] = [];
  public nativeBcfTopics?: OBC.BCFTopics;
  public nativeViewpoints?: OBC.Viewpoints;
  private bcfMarkerIds: string[] = [];

  private constructor() {
    this.engine = BimEngine.getInstance();
    // Default coordination topics
    this.topics = [
      {
        guid: "bcf-001-clash-duct-beam",
        topicType: "Clash",
        topicStatus: "Open",
        priority: "Critical",
        title: "MEP Supply Duct #402 intersects Structural Beam #109",
        description: "Hard clash detected on Level 1 corridor. Clearance deficit of 142mm. Recommend vertical reroute.",
        creationDate: new Date().toISOString(),
        creationAuthor: "BIM Coordinator",
        assignedTo: "HVAC Engineering Lead",
        viewpoint: {
          cameraPosition: { x: 12.4, y: 5.2, z: -8.1 },
          cameraTarget: { x: 10.0, y: 3.5, z: -5.0 },
          selectedElementGuids: ["3yK9v82B10FxM", "1aB8x93D40EzL"],
        },
      },
      {
        guid: "bcf-002-headroom-clearance",
        topicType: "Architectural",
        topicStatus: "In Review",
        priority: "Major",
        title: "Stair 02 Minimum Headroom Clearance Violation",
        description: "Clearance between Stair Flight 02 and lower slab edge is 1.95m (Minimum required is 2.10m per IBC 1011.3).",
        creationDate: new Date().toISOString(),
        creationAuthor: "Lead Architect",
        assignedTo: "Structural Engineer",
        viewpoint: {
          cameraPosition: { x: -4.2, y: 4.8, z: 15.0 },
          cameraTarget: { x: -2.0, y: 2.0, z: 12.0 },
          selectedElementGuids: ["2mP9k41Q88WsR"],
        },
      },
    ];

    this.initNativeBcfEngine();
  }

  private initNativeBcfEngine() {
    try {
      this.nativeBcfTopics = this.engine.bcfTopics || this.engine.components?.get(OBC.BCFTopics);
      this.nativeViewpoints = this.engine.components?.get(OBC.Viewpoints);
      if (this.nativeBcfTopics && !this.nativeBcfTopics.isSetup) {
        this.nativeBcfTopics.setup({
          author: "coordinator@bim-kintsugi.io",
          version: "3",
          strict: false,
        });
      }
      if (this.nativeViewpoints && this.engine.world) {
        this.nativeViewpoints.world = this.engine.world;
      }
    } catch (e) {}
  }

  public static getInstance(): BcfIssueManager {
    if (!BcfIssueManager.instance) {
      BcfIssueManager.instance = new BcfIssueManager();
    }
    return BcfIssueManager.instance;
  }

  public getTopics(): BcfTopic[] {
    return this.topics;
  }

  public createIssue(title: string, description: string, priority: BcfPriority = "Normal", assignedTo: string = "Team Member"): BcfTopic {
    SoundManager.getInstance().playClick();

    const camera = this.engine.world?.camera?.three;
    const camPos = camera?.position || new THREE.Vector3(0, 5, 10);
    const target = new THREE.Vector3(0, 0, 0);
    try {
      if (this.engine.world?.camera?.controls && typeof (this.engine.world.camera.controls as any).getTarget === "function") {
        (this.engine.world.camera.controls as any).getTarget(target);
      }
    } catch (e) {}

    let guid = `bcf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Sync with ThatOpen native OBC.BCFTopics & OBC.Viewpoints
    try {
      if (this.nativeBcfTopics) {
        const obcTopic = this.nativeBcfTopics.create({
          title,
          description,
          type: "Coordination",
          status: "Open",
          priority,
          assignedTo,
        });
        if (obcTopic?.guid) {
          guid = obcTopic.guid;
        }
        if (this.nativeViewpoints && this.engine.world) {
          const vp = this.nativeViewpoints.create();
          vp.world = this.engine.world;
          obcTopic.viewpoints.add(vp.guid);
        }
      }
    } catch (e) {}

    const newTopic: BcfTopic = {
      guid,
      topicType: "Coordination",
      topicStatus: "Open",
      priority,
      title,
      description,
      creationDate: new Date().toISOString(),
      creationAuthor: "User",
      assignedTo,
      viewpoint: {
        cameraPosition: { x: camPos.x, y: camPos.y, z: camPos.z },
        cameraTarget: { x: target.x, y: target.y, z: target.z },
        selectedElementGuids: [],
      },
    };

    this.topics.unshift(newTopic);
    this.registerTopicMarker(newTopic);
    return newTopic;
  }

  public createIssueFromClash(clash: {
    id: string;
    disciplineA: string;
    disciplineB: string;
    severity: string;
    overlapDistance: number;
    intersectionPoint: [number, number, number];
    elementA: { modelId: string; expressId: number; name: string };
    elementB: { modelId: string; expressId: number; name: string };
  }): BcfTopic {
    const priority: BcfPriority =
      clash.severity === "critical"
        ? "Critical"
        : clash.severity === "major"
        ? "Major"
        : "Normal";
    const title = `[CLASH] ${clash.elementA.name} × ${clash.elementB.name}`;
    const description = `${clash.disciplineA} vs ${clash.disciplineB} collision (${(clash.overlapDistance * 1000).toFixed(0)}mm overlap) between #${clash.elementA.expressId} and #${clash.elementB.expressId}.`;

    const p = clash.intersectionPoint;
    const topic = this.createIssue(title, description, priority, `${clash.disciplineA} Lead`);
    topic.topicType = "Clash";
    topic.viewpoint = {
      cameraPosition: { x: p[0] + 4.5, y: p[1] + 3.5, z: p[2] + 4.5 },
      cameraTarget: { x: p[0], y: p[1], z: p[2] },
      selectedElementGuids: [
        `${clash.elementA.modelId}:${clash.elementA.expressId}`,
        `${clash.elementB.modelId}:${clash.elementB.expressId}`,
      ],
    };
    this.registerTopicMarker(topic);
    return topic;
  }

  public registerTopicMarker(topic: BcfTopic) {
    try {
      if (this.engine.marker && this.engine.world && typeof document !== "undefined") {
        const badge = document.createElement("div");
        badge.className = "bim-bcf-3d-marker";
        badge.style.cssText = `
          background: rgba(59, 130, 246, 0.92);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.45);
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 2px 8px rgba(0,0,0,0.45);
          white-space: nowrap;
        `;
        badge.textContent = `📌 ${topic.title.slice(0, 18)}`;
        badge.title = `${topic.title} (${topic.priority})`;
        badge.addEventListener("click", (e) => {
          e.stopPropagation();
          this.restoreViewpoint(topic);
        });
        const pt = topic.viewpoint.cameraTarget;
        const id = this.engine.marker.create(
          this.engine.world,
          badge,
          new THREE.Vector3(pt.x, pt.y, pt.z)
        );
        if (id) {
          this.bcfMarkerIds.push(id);
        }
      }
    } catch (e) {}
  }

  public restoreViewpoint(topic: BcfTopic) {
    try {
      const camera = this.engine.world?.camera;
      if (!camera || !camera.controls) return;

      const vp = topic.viewpoint;
      camera.controls.setLookAt(
        vp.cameraPosition.x,
        vp.cameraPosition.y,
        vp.cameraPosition.z,
        vp.cameraTarget.x,
        vp.cameraTarget.y,
        vp.cameraTarget.z,
        true
      );
      SoundManager.getInstance().playSnap();
    } catch (e) {}
  }

  public async exportNativeBcfZip(): Promise<boolean> {
    try {
      if (this.nativeBcfTopics && typeof this.nativeBcfTopics.export === "function") {
        const blob = await this.nativeBcfTopics.export();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `BIM_Kintsugi_Topics_${Date.now()}.bcfzip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return true;
      }
    } catch (e) {}
    return false;
  }

  public exportBcfJson() {
    SoundManager.getInstance().playShutter();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.topics, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `BIM_Kintsugi_BCF_Issues_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Imports BCF topics from a .bcfzip/.bcf binary archive (via OBC.BCFTopics.load)
   * or a .json/.bcf.json file, registers 3D OBF.Marker pins, and returns the imported count.
   */
  public async importBcfData(input: File | ArrayBuffer | string): Promise<number> {
    let importedCount = 0;

    try {
      // 1. Handle JSON string or JSON file
      let jsonText: string | null = null;
      if (typeof input === "string") {
        jsonText = input;
      } else if (typeof File !== "undefined" && input instanceof File) {
        const lowerName = input.name.toLowerCase();
        if (lowerName.endsWith(".json")) {
          jsonText = await input.text();
        } else {
          const buffer = await input.arrayBuffer();
          return this.importBcfBinaryBuffer(buffer);
        }
      } else if (input instanceof ArrayBuffer) {
        return this.importBcfBinaryBuffer(input);
      }

      if (jsonText) {
        const parsed = JSON.parse(jsonText);
        const list: any[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.topics)
          ? parsed.topics
          : [];

        for (const item of list) {
          if (!item || !item.title) continue;
          if (this.topics.some((t) => t.guid === item.guid)) continue;

          const vp = item.viewpoint || {};
          const camPos = vp.cameraPosition || vp.camera_view_point || { x: 10, y: 6, z: 10 };
          const camTarget = vp.cameraTarget || vp.direction || { x: 0, y: 2, z: 0 };

          const topic: BcfTopic = {
            guid: item.guid || `bcf-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            topicType: item.topicType || item.topic_type || "Coordination",
            topicStatus: item.topicStatus || item.topic_status || "Open",
            priority: (["Critical", "Major", "Normal", "Minor"].includes(item.priority) ? item.priority : "Normal") as BcfPriority,
            title: String(item.title),
            description: String(item.description || "Imported BCF Coordination Issue"),
            creationDate: item.creationDate || item.creation_date || new Date().toISOString(),
            creationAuthor: item.creationAuthor || item.creation_author || "External BCF",
            assignedTo: item.assignedTo || item.assigned_to || "BIM Coordinator",
            viewpoint: {
              cameraPosition: {
                x: Number(camPos.x) || 10,
                y: Number(camPos.y) || 6,
                z: Number(camPos.z) || 10,
              },
              cameraTarget: {
                x: Number(camTarget.x) || 0,
                y: Number(camTarget.y) || 2,
                z: Number(camTarget.z) || 0,
              },
              selectedElementGuids: Array.isArray(vp.selectedElementGuids)
                ? vp.selectedElementGuids
                : Array.isArray(vp.components)
                ? vp.components
                : [],
            },
          };

          this.topics.unshift(topic);
          this.registerTopicMarker(topic);
          importedCount++;
        }
      }
    } catch (e) {
      console.warn("BCF import error:", e);
    }

    if (importedCount > 0) {
      SoundManager.getInstance().playSnap();
    }
    return importedCount;
  }

  private async importBcfBinaryBuffer(buffer: ArrayBuffer): Promise<number> {
    let importedCount = 0;
    try {
      if (this.nativeBcfTopics && typeof (this.nativeBcfTopics as any).load === "function") {
        const bytes = new Uint8Array(buffer);
        await (this.nativeBcfTopics as any).load(bytes);

        const list = (this.nativeBcfTopics as any).list;
        if (list && typeof list.values === "function") {
          for (const obcTopic of list.values()) {
            const guid = obcTopic.guid || `bcf-${Date.now()}`;
            if (this.topics.some((t) => t.guid === guid)) continue;

            const topic: BcfTopic = {
              guid,
              topicType: obcTopic.type || "Coordination",
              topicStatus: (obcTopic.status as BcfStatus) || "Open",
              priority: (["Critical", "Major", "Normal", "Minor"].includes(obcTopic.priority)
                ? obcTopic.priority
                : "Normal") as BcfPriority,
              title: obcTopic.title || "Imported BCF Topic",
              description: obcTopic.description || "Imported from .bcfzip package",
              creationDate: obcTopic.creationDate ? new Date(obcTopic.creationDate).toISOString() : new Date().toISOString(),
              creationAuthor: obcTopic.creationAuthor || "BCF Author",
              assignedTo: obcTopic.assignedTo || "BIM Coordinator",
              viewpoint: {
                cameraPosition: { x: 12, y: 6, z: 12 },
                cameraTarget: { x: 0, y: 2, z: 0 },
                selectedElementGuids: [],
              },
            };
            this.topics.unshift(topic);
            this.registerTopicMarker(topic);
            importedCount++;
          }
        }
      }
    } catch (e) {
      // Fallback: check if the ArrayBuffer is actually UTF-8 JSON
      try {
        const text = new TextDecoder().decode(buffer);
        if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
          return this.importBcfData(text);
        }
      } catch (err) {}
    }
    return importedCount;
  }
}
