import * as THREE from "three";
import * as OBC from "@thatopen/components";
import { BimEngine } from "../core/BimEngine";

export interface CustomHighlightStyle {
  id: string;
  name: string;
  color: string;
  opacity: number;
  transparent: boolean;
  renderedFaces?: any;
  priority?: number;
}

export class HighlighterManager {
  private static instance: HighlighterManager | null = null;
  private engine: BimEngine;
  private customStyles: Map<string, CustomHighlightStyle> = new Map();
  private activeCustomStyles: Set<string> = new Set();

  private constructor() {
    this.engine = BimEngine.getInstance();
    this.initDefaultCustomStyles();
  }

  public static getInstance(): HighlighterManager {
    if (!HighlighterManager.instance) {
      HighlighterManager.instance = new HighlighterManager();
    }
    return HighlighterManager.instance;
  }

  private initDefaultCustomStyles() {
    // Register presets (Accent/Gold, Red, Emerald, Amber, Purple, Cyan)
    const defaults: CustomHighlightStyle[] = [
      { id: "Gold", name: "Accent / Gold", color: "#D4FF3F", opacity: 0.85, transparent: true },
      { id: "Accent", name: "Theme Accent", color: "#D4FF3F", opacity: 0.85, transparent: true },
      { id: "Red", name: "Red Alert", color: "#ef4444", opacity: 0.8, transparent: true },
      { id: "Green", name: "Pass / Green", color: "#10b981", opacity: 0.8, transparent: true },
      { id: "Amber", name: "Warning / Amber", color: "#f59e0b", opacity: 0.8, transparent: true },
      { id: "Purple", name: "VIP / Purple", color: "#a855f7", opacity: 0.8, transparent: true },
      { id: "Cyan", name: "Review / Cyan", color: "#06b6d4", opacity: 0.8, transparent: true },
    ];

    defaults.forEach((st) => this.registerStyle(st));
  }

  public registerStyle(style: CustomHighlightStyle) {
    this.customStyles.set(style.id, style);
    const highlighter = this.engine.highlighter;
    if (highlighter && highlighter.styles) {
      highlighter.styles.set(style.id, {
        color: new THREE.Color(style.color),
        opacity: style.opacity,
        transparent: style.transparent,
        renderedFaces: 0 as any,
        priority: style.priority ?? 25,
      });

      // Hook events if available
      try {
        if (highlighter.events && highlighter.events[style.id]) {
          highlighter.events[style.id].onHighlight.add((map: any) => {
            console.log(`[Highlighter] Highlighted with "${style.name}" (${style.id}):`, map);
          });
          highlighter.events[style.id].onClear.add((map: any) => {
            console.log(`[Highlighter] Style "${style.name}" (${style.id}) cleared:`, map);
          });
        }
      } catch (e) {
        // Event hook fallback
      }
    }
  }

  public getStyles(): CustomHighlightStyle[] {
    return Array.from(this.customStyles.values());
  }

  public getStyle(id: string): CustomHighlightStyle | undefined {
    return this.customStyles.get(id);
  }

  public updateStyleColor(id: string, colorHex: string) {
    const style = this.customStyles.get(id);
    if (!style) return;
    style.color = colorHex;
    const highlighter = this.engine.highlighter;
    if (highlighter && highlighter.styles && highlighter.styles.has(id)) {
      const liveStyle = highlighter.styles.get(id);
      if (liveStyle) {
        liveStyle.color = new THREE.Color(colorHex);
      }
    }
  }

  public updateStyleOpacity(id: string, opacity: number) {
    const style = this.customStyles.get(id);
    if (!style) return;
    style.opacity = opacity;
    const highlighter = this.engine.highlighter;
    if (highlighter && highlighter.styles && highlighter.styles.has(id)) {
      const liveStyle = highlighter.styles.get(id);
      if (liveStyle) {
        liveStyle.opacity = opacity;
      }
    }
  }

  /**
   * Apply a custom highlight style to the current selection
   * Note: As per ThatOpen Engine Highlighter docs, 'select' style takes precedence
   * while selected; once deselected or cleared from select, the custom color is visible.
   */
  public async applyCustomHighlight(styleId: string, clearSelectAfter: boolean = false): Promise<boolean> {
    const highlighter = this.engine.highlighter;
    if (!highlighter) return false;

    if (!highlighter.styles.has(styleId)) {
      const registered = this.customStyles.get(styleId);
      if (registered) {
        this.registerStyle(registered);
      } else {
        return false;
      }
    }

    const selection = highlighter.selection["select"] || highlighter.selection.select;
    if (!selection || OBC.ModelIdMapUtils.isEmpty(selection)) {
      return false;
    }

    // Apply custom style to current selection
    await highlighter.highlightByID(styleId, selection, false);
    this.activeCustomStyles.add(styleId);

    if (clearSelectAfter) {
      await highlighter.clear("select");
    }

    return true;
  }

  /**
   * Clear a custom highlight style either for currently selected items or globally for all items
   */
  public async resetCustomHighlighter(styleId: string, onlySelected: boolean = true): Promise<void> {
    const highlighter = this.engine.highlighter;
    if (!highlighter) return;

    if (!highlighter.styles.has(styleId)) return;

    if (onlySelected) {
      const selection = highlighter.selection["select"] || highlighter.selection.select;
      if (selection && !OBC.ModelIdMapUtils.isEmpty(selection)) {
        await highlighter.clear(styleId, selection);
      } else {
        // If nothing is selected, clear entire style
        await highlighter.clear(styleId);
      }
    } else {
      await highlighter.clear(styleId);
    }

    // Optionally also clear 'select' so user immediately sees original materials
    await highlighter.clear("select");
  }

  /**
   * Clear all custom highlighters across all registered styles
   */
  public async clearAllCustomHighlights(): Promise<void> {
    const highlighter = this.engine.highlighter;
    if (!highlighter) return;

    for (const styleId of this.customStyles.keys()) {
      try {
        await highlighter.clear(styleId);
      } catch (e) {
        // continue
      }
    }
    this.activeCustomStyles.clear();
    await highlighter.clear("select");
    await highlighter.clear("hover");
  }

  /**
   * Assigns deterministic render priority tiers (`priority` in `@thatopen/components-front >= 3.4.9`)
   * so higher-precedence styles remain visually isolated while lower-priority overlays restore automatically.
   */
  public static applyStylePriorities(highlighter: any): void {
    const styles = highlighter?.styles;
    if (!styles || typeof styles.get !== "function") return;

    const priorityMap: Record<string, number> = {
      select: 100,
      ClashElementA: 60,
      ClashElementB: 60,
      IDS_Fail: 45,
      "audit-unassigned": 40,
      IDS_Pass: 35,
      "timeline-variance-critical": 35,
      "timeline-planned": 30,
      "timeline-inprogress": 30,
      "timeline-completed": 30,
      "timeline-variance-ahead": 30,
      "timeline-variance-onschedule": 30,
      "timeline-variance-delayed": 30,
      "cascade-band-0": 32,
      "cascade-band-1": 32,
      "cascade-band-2": 32,
      "cascade-band-3": 32,
      "cascade-band-4": 32,
      hover: 10,
      "audit-ghost": 5,
    };

    for (const [styleId, priority] of Object.entries(priorityMap)) {
      const styleDef = styles.get(styleId);
      if (styleDef && typeof styleDef === "object") {
        styleDef.priority = priority;
      }
    }
  }
}
