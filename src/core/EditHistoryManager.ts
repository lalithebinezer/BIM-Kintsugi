/**
 * EditHistoryManager — Command-Pattern 50-Step Undo / Redo Engine
 *
 * Tracks reversible user mutations across 4D schedule date shifts, What-If
 * delay acceptance, cost rate adjustments, and BIM inspector property edits.
 */

export interface ReversibleEditCommand {
  id: string;
  label: string;
  timestamp: number;
  apply: () => void | Promise<void>;
  revert: () => void | Promise<void>;
}

export class EditHistoryManager {
  private static instance: EditHistoryManager | null = null;
  private undoStack: ReversibleEditCommand[] = [];
  private redoStack: ReversibleEditCommand[] = [];
  private readonly maxDepth: number;
  private listeners = new Set<() => void>();

  constructor(maxDepth = 50) {
    this.maxDepth = maxDepth;
  }

  public static getInstance(): EditHistoryManager {
    if (!this.instance) this.instance = new EditHistoryManager();
    return this.instance;
  }

  public async execute(cmd: Omit<ReversibleEditCommand, "timestamp">): Promise<void> {
    const fullCmd: ReversibleEditCommand = { ...cmd, timestamp: Date.now() };
    await fullCmd.apply();
    this.undoStack.push(fullCmd);
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.notify();
  }

  public async undo(): Promise<ReversibleEditCommand | null> {
    const cmd = this.undoStack.pop();
    if (!cmd) return null;
    await cmd.revert();
    this.redoStack.push(cmd);
    this.notify();
    return cmd;
  }

  public async redo(): Promise<ReversibleEditCommand | null> {
    const cmd = this.redoStack.pop();
    if (!cmd) return null;
    await cmd.apply();
    this.undoStack.push(cmd);
    this.notify();
    return cmd;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public peekUndoLabel(): string | null {
    return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1].label : null;
  }

  public peekRedoLabel(): string | null {
    return this.redoStack.length > 0 ? this.redoStack[this.redoStack.length - 1].label : null;
  }

  public getStackSizes(): { undo: number; redo: number } {
    return { undo: this.undoStack.length, redo: this.redoStack.length };
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    for (const fn of this.listeners) fn();
  }
}
