/**
 * BCF Manager — Building Collaboration Format (BCF 2.1/3.0) Integration.
 *
 * Manages BCF topics, viewpoints, comments, importing, and exporting.
 */

import * as OBC from "@thatopen/components";

export interface BCFFormTopic {
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  assignedTo?: string;
}

export class BCFManager {
  private components: OBC.Components;
  private world: any;
  public bcfTopics: OBC.BCFTopics;

  constructor(components: OBC.Components, world: any) {
    this.components = components;
    this.world = world;
    this.bcfTopics = components.get(OBC.BCFTopics);
  }

  public init(authorEmail: string = "engineer@bim-twin.com"): void {
    this.bcfTopics.setup({
      author: authorEmail,
      types: new Set(["Clash", "Coordination", "Schedule Risk", "Cost OVR", "Information", "Fault"]),
      statuses: new Set(["Active", "In Progress", "Done", "In Review", "Closed"]),
      users: new Set([authorEmail, "architect@bim-twin.com", "mep@bim-twin.com", "contractor@bim-twin.com"]),
      version: "3",
    });

    // Auto-create Viewpoint when a topic is added
    const viewpoints = this.components.get(OBC.Viewpoints);
    this.bcfTopics.list.onItemSet.add(async ({ value: topic }) => {
      try {
        const viewpoint = viewpoints.create();
        viewpoint.world = this.world;
        topic.viewpoints.add(viewpoint.guid);
      } catch (err) {
        console.warn("Auto-viewpoint creation skipped:", err);
      }
    });
  }

  /**
   * Create a new BCF topic with optional viewpoint snapshot.
   */
  public createTopic(params: BCFFormTopic): any {
    const topic = this.bcfTopics.create({
      title: params.title,
      description: params.description,
      type: params.type || "Coordination",
      priority: params.priority || "Normal",
      status: params.status || "Active",
      assignedTo: params.assignedTo,
    });
    return topic;
  }

  /**
   * Export all BCF topics as a downloadable .bcfzip file.
   */
  public async exportBCF(filename?: string): Promise<void> {
    const bcfData = await this.bcfTopics.export();
    const blob = new Blob([bcfData], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `BIM_Topics_${new Date().toISOString().split("T")[0]}.bcfzip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import a BCF file from binary data.
   */
  public async loadBCF(buffer: ArrayBuffer): Promise<void> {
    await this.bcfTopics.load(new Uint8Array(buffer));
  }
}
