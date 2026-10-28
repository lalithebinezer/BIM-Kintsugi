import { BimEngine } from "../core/BimEngine";
import { SelectionManager } from "./SelectionManager";
import { ClashDetector } from "./ClashDetector";
import { CarbonLcaManager } from "./CarbonLcaManager";
import { MeasurementSuite } from "./MeasurementSuite";
import { StoreyLevelSlicer } from "./StoreyLevelSlicer";
import { GraphicsVFXManager } from "./GraphicsVFXManager";
import { escapeHtml } from "../utils/formatters";

export interface CopilotMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  actionsExecuted?: string[];
  suggestedFollowUps?: string[];
  timestamp: string;
}

export class BimAiCopilot {
  private static instance: BimAiCopilot;
  private messageHistory: CopilotMessage[] = [];
  public isProcessing: boolean = false;

  private constructor() {
    // Default greeting message
    this.messageHistory.push({
      id: "msg_init",
      sender: "ai",
      text: "Hello! I am your BIM Kintsugi AI Copilot. Ask me to select elements, run clash tests, inspect embodied carbon, or isolate building storeys.",
      suggestedFollowUps: [
        "Select all load-bearing walls",
        "Run clash audit between MEP & Structure",
        "Show carbon sustainability heatmap",
        "Isolate all columns",
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  }

  public static getInstance(): BimAiCopilot {
    if (!BimAiCopilot.instance) {
      BimAiCopilot.instance = new BimAiCopilot();
    }
    return BimAiCopilot.instance;
  }

  public getHistory(): CopilotMessage[] {
    return this.messageHistory;
  }

  /**
   * Processes natural language query and dispatches BIM commands.
   */
  public async executeQuery(query: string): Promise<CopilotMessage> {
    this.isProcessing = true;
    const userMsg: CopilotMessage = {
      id: `msg_u_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    this.messageHistory.push(userMsg);

    const q = query.toLowerCase().trim();
    let responseText = "";
    const executed: string[] = [];
    const followUps: string[] = [];

    const selectionMgr = SelectionManager.getInstance();
    const clashDetector = ClashDetector.getInstance();
    const carbonMgr = CarbonLcaManager.getInstance();
    const measureSuite = MeasurementSuite.getInstance();

    // 1. Clash Detection Queries
    if (q.includes("clash") || q.includes("collision") || q.includes("intersect")) {
      const results = await clashDetector.runClashAudit();
      const crit = results.filter((c) => c.severity === "critical").length;
      responseText = `I executed a full multi-discipline clash audit across loaded models. Found ${results.length} total clashes (${crit} critical). I have marked them with 3D beacons in the viewport.`;
      executed.push("Run Clash Matrix Audit", "Render 3D Clash Beacons");
      followUps.push("Export clashes to BCF", "Zoom to critical clash #1", "Clear clash markers");
    }

    // 2. Carbon / Sustainability Queries
    else if (q.includes("carbon") || q.includes("lca") || q.includes("sustainability") || q.includes("green") || q.includes("emission")) {
      carbonMgr.toggleHeatmap(true);
      const summary = carbonMgr.calculateProjectCarbon();
      responseText = `I activated the 6D Embodied Carbon Heatmap. Total project carbon is ${summary.totalCarbonTonnes.toFixed(1)} tCO₂e with an intensity rating of ${summary.ratingGrade} (${summary.carbonIntensityPerM2.toFixed(1)} kg/m²). Green alternative substitution can save up to ${summary.potentialSavingsTonnes.toFixed(1)} tCO₂e.`;
      executed.push("Activate Carbon Heatmap", "Calculate LCA Metrics");
      followUps.push("Simulate Fly Ash concrete substitution", "Disable heatmap", "Export carbon report");
    }

    // 3. Category Selection / Isolation Queries
    else if (q.includes("select all") || q.includes("isolate") || q.includes("show only") || q.includes("filter")) {
      let targetCat = "IFCWALL";
      if (q.includes("wall")) targetCat = "IFCWALL";
      else if (q.includes("column")) targetCat = "IFCCOLUMN";
      else if (q.includes("beam")) targetCat = "IFCBEAM";
      else if (q.includes("slab") || q.includes("floor")) targetCat = "IFCSLAB";
      else if (q.includes("door")) targetCat = "IFCDOOR";
      else if (q.includes("window")) targetCat = "IFCWINDOW";
      else if (q.includes("duct") || q.includes("mep") || q.includes("pipe")) targetCat = "IFCDUCTSEGMENT";

      selectionMgr.filterSelectionToCategory(targetCat);
      responseText = `Filtered and selected all elements matching category "${targetCat}". The viewport selection bar and batch takeoff cards have been updated.`;
      executed.push(`Select Category: ${targetCat}`, "Update Selection HUD");
      followUps.push("Invert selection (Ctrl+I)", "Save as Selection Set", "Clear selection (Esc)");
    }

    // 4. Invert / Select All / Clear
    else if (q.includes("invert")) {
      await selectionMgr.invertSelection();
      responseText = "Inverted active 3D selection across the model.";
      executed.push("Invert Selection (Ctrl+I)");
    } else if (q.includes("select all") || q.includes("everything")) {
      await selectionMgr.selectAll();
      responseText = "Selected all elements across all loaded models.";
      executed.push("Select All (Ctrl+A)");
    } else if (q.includes("clear") || q.includes("deselect") || q.includes("reset")) {
      await selectionMgr.clearSelection();
      carbonMgr.toggleHeatmap(false);
      measureSuite.clearAllMeasurements();
      responseText = "Cleared all active 3D selections, measurement callouts, and heatmaps.";
      executed.push("Clear All Selections (Esc)");
    }

    // 5. Dimension / Measurement Queries
    else if (q.includes("measure") || q.includes("dimension") || q.includes("distance")) {
      measureSuite.startMeasurement("distance");
      responseText = "Measurement tool is now ACTIVE in Distance mode. Click on 3D vertices or edges in the viewport to place dimension callouts.";
      executed.push("Start Distance Measurement");
      followUps.push("Measure surface area", "Clear measurements");
    }

    // 6. Building Storey / Floor Slicing Queries
    else if (q.includes("slice") || q.includes("storey") || q.includes("level") || q.includes("floor plan")) {
      const slicer = StoreyLevelSlicer.getInstance();
      const levels = slicer.levels;
      let matchedIndex = 0;
      const numMatch = q.match(/(\d+)/);
      if (numMatch) {
        const levelNum = parseInt(numMatch[1], 10);
        matchedIndex = Math.min(Math.max(0, levelNum), levels.length - 1);
      } else if (q.includes("roof")) {
        matchedIndex = levels.length - 1;
      }
      slicer.setStorey(matchedIndex);
      const activeLvl = levels[matchedIndex];
      responseText = `Activated horizontal section cut and OBC.Views 2D plan for "${activeLvl?.name || "Level 0"}" at elevation ${activeLvl?.elevation ?? 0}m.`;
      executed.push(`Slice Storey: ${activeLvl?.name || "Level 0"}`, "Sync OBC.Views Section Cut");
      followUps.push("Clear floor slice", "Slice Level 1", "Slice Roof Level");
    }

    // 7. Postproduction Render Style Queries (Pen / Technical Drawing / Gloss / Cinematic)
    else if (q.includes("pen") || q.includes("sketch") || q.includes("blueprint") || q.includes("technical") || q.includes("gloss") || q.includes("cinematic")) {
      const vfx = GraphicsVFXManager.getInstance();
      if (q.includes("pen") || q.includes("sketch") || q.includes("blueprint") || q.includes("technical")) {
        vfx.setRenderStyle("pen-shadows");
        responseText = "Switched ThatOpen PostproductionRenderer to Technical Pen + Shadows mode (OBF.PostproductionAspect.PEN_SHADOWS).";
        executed.push("Render Style: Pen + Shadows");
      } else if (q.includes("gloss")) {
        vfx.setRenderStyle("gloss");
        responseText = "Enabled Postproduction Gloss reflections pass with ambient shadows.";
        executed.push("Render Style: Glossy Architectural");
      } else {
        vfx.setPreset("cinematic");
        vfx.setRenderStyle("color-pen-shadows");
        responseText = "Applied Cinematic ACES Filmic preset with Color + Pen Edges + Ambient Shadows.";
        executed.push("Preset: Cinematic", "Render Style: Color + Pen + Shadows");
      }
      followUps.push("Switch to Pen drawing style", "Switch to Cinematic style", "Reset selection");
    }

    // Default Fallback: Query OBC.ItemsFinder + optional local Ollama LLM
    else {
      let finderSummary = "";
      try {
        const engine = BimEngine.getInstance();
        if (engine.finder && engine.finder.list.size > 0) {
          finderSummary = ` (${engine.finder.list.size} saved OBC.ItemsFinder queries available)`;
        }
      } catch (e) {}

      const ollamaReply = await this.queryLocalOllama(query);
      if (ollamaReply) {
        responseText = ollamaReply;
        executed.push("Local Ollama LLM Inference");
      } else {
        responseText = `I analyzed your request: "${query}"${finderSummary}. I am ready to perform spatial operations, property filters, storey slicing, or automated quantity takeoff on the active BIM model.`;
      }
      followUps.push("Select all columns", "Run clash detection", "Slice Level 1", "Switch to Pen drawing style");
    }

    const aiMsg: CopilotMessage = {
      id: `msg_ai_${Date.now()}`,
      sender: "ai",
      text: responseText,
      actionsExecuted: executed,
      suggestedFollowUps: followUps,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    this.messageHistory.push(aiMsg);
    this.isProcessing = false;
    this.updateCopilotUI();
    return aiMsg;
  }

  private async queryLocalOllama(prompt: string): Promise<string | null> {
    if (typeof fetch === "undefined") return null;
    if (
      (globalThis as any).process?.env?.VITEST &&
      (typeof localStorage === "undefined" || localStorage.getItem("bim_enable_ollama") !== "true")
    ) {
      return null;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 900);
      const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.2:latest",
          prompt: `You are BIM Kintsugi AI Copilot inside a ThatOpen 3D IFC viewer. Answer concisely in 1-2 sentences: ${prompt}`,
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data?.response === "string" && data.response.trim().length > 0
        ? data.response.trim()
        : null;
    } catch {
      return null;
    }
  }

  public updateCopilotUI() {
    if (typeof document === "undefined") return;

    const chatContainer = document.getElementById("copilot-chat-messages");
    if (!chatContainer) return;

    chatContainer.innerHTML = "";
    this.messageHistory.forEach((msg) => {
      const msgDiv = document.createElement("div");
      msgDiv.className = `copilot-msg msg-${msg.sender}`;
      msgDiv.innerHTML = `
        <div class="msg-header">
          <span class="msg-sender-name">${msg.sender === "ai" ? "BIM AI Copilot" : "You"}</span>
          <span class="msg-time">${escapeHtml(msg.timestamp)}</span>
        </div>
        <div class="msg-body">${escapeHtml(msg.text)}</div>
        ${msg.actionsExecuted && msg.actionsExecuted.length > 0 ? `
          <div class="msg-actions">
            ${msg.actionsExecuted.map((a) => `<span class="action-tag">✓ ${escapeHtml(a)}</span>`).join("")}
          </div>
        ` : ""}
        ${msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 ? `
          <div class="msg-chips">
            ${msg.suggestedFollowUps.map((chip) => `<button class="copilot-prompt-chip" data-prompt="${escapeHtml(chip)}">${escapeHtml(chip)}</button>`).join("")}
          </div>
        ` : ""}
      `;

      msgDiv.querySelectorAll(".copilot-prompt-chip").forEach((btn) => {
        btn.addEventListener("click", () => {
          const prompt = (btn as HTMLElement).dataset.prompt;
          if (prompt) {
            this.executeQuery(prompt);
          }
        });
      });

      chatContainer.appendChild(msgDiv);
    });

    document.querySelectorAll(".copilot-chip-btn").forEach((chip) => {
      chip.addEventListener("click", () => {
        const q = (chip as HTMLElement).dataset.query;
        if (q) this.executeQuery(q);
      });
    });

    const voiceBtn = document.getElementById("btn-copilot-voice");
    if (voiceBtn && !voiceBtn.hasAttribute("data-bound")) {
      voiceBtn.setAttribute("data-bound", "true");
      voiceBtn.addEventListener("click", () => {
        const prompts = [
          "Run clash audit between MEP and Structure",
          "Show carbon sustainability heatmap",
          "Select all load-bearing walls",
          "Isolate all columns",
        ];
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
        const input = document.getElementById("copilot-user-input") as HTMLInputElement;
        if (input) {
          input.value = randomPrompt;
          this.executeQuery(randomPrompt);
          input.value = "";
        }
      });
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}
