import * as THREE from "three";
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

    const newTopic: BcfTopic = {
      guid: `bcf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
    return newTopic;
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
}
