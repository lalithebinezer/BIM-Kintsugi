/**
 * AppStateStore — Strongly Typed Reactive Pub/Sub Application State
 *
 * Replaces scattered implicit global mutations with a single deterministic,
 * subscribable state container shared across UI controllers and 4D/5D suites.
 */

export type ThemeId = "dark" | "light-studio" | "light" | "zen" | "cyberpunk" | "blueprint";
export type WorkspacePersonaId = "all" | "design" | "planner-4d" | "commercial-5d" | "field";

export interface AppState {
  activeTheme: ThemeId;
  workspacePersona: WorkspacePersonaId;
  is4dMode: boolean;
  currentTimelineDateMs: number | null;
  loadedModelIds: string[];
  selectedElementCount: number;
  lookaheadWeeks: number | null;
  jobsiteTouchMode: boolean;
  collabPeersCount: number;
}

export type StateListener<K extends keyof AppState = keyof AppState> = (
  next: AppState,
  prev: AppState,
  changedKeys: K[]
) => void;

const INITIAL_STATE: AppState = {
  activeTheme: "dark",
  workspacePersona: "all",
  is4dMode: false,
  currentTimelineDateMs: null,
  loadedModelIds: [],
  selectedElementCount: 0,
  lookaheadWeeks: null,
  jobsiteTouchMode: false,
  collabPeersCount: 0,
};

export class AppStateStore {
  private static instance: AppStateStore | null = null;
  private state: AppState = { ...INITIAL_STATE };
  private listeners = new Set<StateListener>();

  public static getInstance(): AppStateStore {
    if (!this.instance) this.instance = new AppStateStore();
    return this.instance;
  }

  public getState(): Readonly<AppState> {
    return this.state;
  }

  public setState(patch: Partial<AppState>): Readonly<AppState> {
    const prev = this.state;
    const changedKeys: Array<keyof AppState> = [];
    const next: AppState = { ...prev };

    for (const key of Object.keys(patch) as Array<keyof AppState>) {
      const value = patch[key];
      if (value !== undefined && prev[key] !== value) {
        (next as Record<keyof AppState, unknown>)[key] = value;
        changedKeys.push(key);
      }
    }

    if (changedKeys.length === 0) return this.state;
    this.state = next;
    for (const listener of this.listeners) {
      listener(this.state, prev, changedKeys);
    }
    return this.state;
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public reset(): void {
    this.setState({ ...INITIAL_STATE, loadedModelIds: [] });
  }
}
