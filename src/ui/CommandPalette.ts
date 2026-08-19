export class CommandPalette {
  private overlay: HTMLElement;
  private commands: { label: string; action: () => void }[];

  constructor(commands: { label: string; action: () => void }[]) {
    this.commands = commands;
    this.overlay = document.createElement("div");
    this.overlay.className = "command-palette-overlay hidden";
    this.overlay.innerHTML = `
      <div class="command-palette-modal">
        <input type="text" class="command-palette-input" placeholder="Type a command or search feature (e.g. Clipping, IDS, 4D)..." />
        <div class="command-palette-results"></div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.setupListeners();
  }

  private setupListeners() {
    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        this.toggle();
      } else if (e.key === "Escape" && !this.overlay.classList.contains("hidden")) {
        this.hide();
      }
    });

    const input = this.overlay.querySelector(".command-palette-input") as HTMLInputElement;
    input.addEventListener("input", () => this.filterCommands(input.value));

    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.hide();
    });
  }

  public toggle() {
    if (this.overlay.classList.contains("hidden")) {
      this.show();
    } else {
      this.hide();
    }
  }

  public show() {
    this.overlay.classList.remove("hidden");
    const input = this.overlay.querySelector(".command-palette-input") as HTMLInputElement;
    input.value = "";
    input.focus();
    this.filterCommands("");
  }

  public hide() {
    this.overlay.classList.add("hidden");
  }

  private filterCommands(query: string) {
    const resultsContainer = this.overlay.querySelector(".command-palette-results") as HTMLElement;
    resultsContainer.innerHTML = "";

    const filtered = this.commands.filter(cmd => cmd.label.toLowerCase().includes(query.toLowerCase()));

    if (filtered.length === 0) {
      resultsContainer.innerHTML = `<div class="command-item empty">No commands found</div>`;
      return;
    }

    filtered.forEach(cmd => {
      const el = document.createElement("div");
      el.className = "command-item";
      el.innerText = cmd.label;
      el.addEventListener("click", () => {
        cmd.action();
        this.hide();
      });
      resultsContainer.appendChild(el);
    });
  }
}
