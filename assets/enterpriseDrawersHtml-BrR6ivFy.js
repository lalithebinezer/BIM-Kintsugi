var e=!1;function t(t){let n=t??document.getElementById(`enterprise-drawers-root`);return n?e&&n.childElementCount>0?n:(n.innerHTML=`    <!-- 1. Dimension & Measurement Suite Drawer -->
    <div id="measurement-panel" class="enterprise-drawer hidden">
      <div class="drawer-header">
        <div class="drawer-title-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-500)" stroke-width="2.2"><path d="M21.3 8.7 8.7 21.3a2.12 2.12 0 0 1-3 0l-4.4-4.4a2.12 2.12 0 0 1 0-3L14 1.3a2.12 2.12 0 0 1 3 0l4.3 4.4a2.12 2.12 0 0 1 0 3Z"/><line x1="14.5" y1="4.5" x2="16.5" y2="6.5"/><line x1="11" y1="8" x2="13" y2="10"/><line x1="7.5" y1="11.5" x2="9.5" y2="13.5"/><line x1="4" y1="15" x2="6" y2="17"/></svg>
          <h3>3D Snap Dimensioning</h3>
        </div>
        <div class="drawer-header-actions">
          <span id="measurement-mode-badge" class="drawer-status-tag">Ready</span>
          <button class="btn-icon drawer-center-toggle-btn" data-target="measurement-panel" aria-label="Toggle Centralized Modal / Right Dock" title="Toggle Centralized Modal / Right Dock"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="3"/></svg></button>
          <button class="btn-icon drawer-close-btn" data-target="measurement-panel" aria-label="Close Dimensions Drawer" title="Close Drawer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <div class="drawer-body thin-scrollbar">
        <div class="drawer-tool-grid">
          <button id="btn-measure-dist" class="btn-drawer-tool active" data-type="distance">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            <span>Distance</span>
          </button>
          <button id="btn-measure-delta" class="btn-drawer-tool" data-type="delta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 22 22 2 22"/></svg>
            <span>ΔXYZ Ortho</span>
          </button>
          <button id="btn-measure-angle" class="btn-drawer-tool" data-type="angle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 21 16 4"/></svg>
            <span>Angle (°)</span>
          </button>
          <button id="btn-measure-area" class="btn-drawer-tool" data-type="area">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            <span>Surface (m²)</span>
          </button>
          <button id="btn-measure-volume" class="btn-drawer-tool" data-type="volume">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <span>Volume (m³)</span>
          </button>
        </div>
        <div class="drawer-section-card">
          <div class="section-card-row">
            <span>Edge &amp; Vertex Snapping</span>
            <label class="toggle-switch">
              <input type="checkbox" id="chk-measure-snap" aria-label="Enable Measurement Edge and Vertex Snap" checked />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="live-measure-preview">
            <span class="live-label">Live Cursor:</span>
            <span id="measurement-snap-badge" class="drawer-status-tag" style="font-size:0.6rem;padding:0.1rem 0.35rem;">SNAP ON</span>
            <span id="measurement-live-val" class="live-val">0.000 m</span>
          </div>
        </div>
        <div class="drawer-section-header">
          <span>Active Measurements (<span id="measurement-count-badge">0 Active</span>)</span>
          <button id="btn-clear-all-measurements" class="btn-xs btn-outline-danger">Clear All</button>
        </div>
        <div id="measurement-list" class="measurement-item-list thin-scrollbar"></div>
      </div>
    </div>

    <!-- 2. Real-Time Clash Matrix Drawer -->
    <div id="clash-panel" class="enterprise-drawer hidden">
      <div class="drawer-header">
        <div class="drawer-title-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <h3>Multi-Discipline Clash Matrix</h3>
        </div>
        <div class="drawer-header-actions">
          <span id="clash-critical-badge" class="drawer-status-tag tag-critical">0 Critical</span>
          <button class="btn-icon drawer-center-toggle-btn" data-target="clash-panel" aria-label="Toggle Centralized Modal / Right Dock" title="Toggle Centralized Modal / Right Dock"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="3"/></svg></button>
          <button class="btn-icon drawer-close-btn" data-target="clash-panel" aria-label="Close Clash Matrix Drawer" title="Close Drawer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <div class="drawer-body thin-scrollbar">
        <div class="drawer-actions-bar">
          <button id="btn-run-clash-audit" class="btn-md btn-accent flex-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>Run Clash Audit</span>
          </button>
          <button id="btn-clear-clashes" class="btn-md btn-outline" title="Clear Clash Results and 3D Markers">
            <span>Clear</span>
          </button>
          <button id="btn-export-clash-bcf" class="btn-md btn-outline" title="Export to BCF 3.0 JSON">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>JSON</span>
          </button>
          <button id="btn-export-clash-bcfzip" class="btn-md btn-outline" title="Export Native .bcfzip Archive with 3D Viewpoints">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15l3 3 3-3"/></svg>
            <span>.bcfzip</span>
          </button>
        </div>
        <div class="clash-toggles-row" style="display: flex; flex-wrap: wrap; gap: 0.65rem; margin-top: 0.45rem; align-items: center;">
          <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.68rem; color: var(--text-muted);">
            <span>Mode</span>
            <select id="clash-scan-mode" class="clash-status-select" aria-label="Clash Scan Mode">
              <option value="static-3d" selected>Static 3D</option>
              <option value="temporal-4d">Temporal 4D</option>
              <option value="workspace-4d">Workspace 4D</option>
            </select>
          </label>
          <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.68rem; color: var(--text-muted); cursor: pointer;">
            <input type="checkbox" id="toggle-clash-deep-bvh" style="accent-color: #f43f5e;" />
            <span>Deep Triangle BVH (<code style="font-size:0.62rem;">OBF.Mesher</code>)</span>
          </label>
          <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.68rem; color: var(--text-muted); cursor: pointer;">
            <input type="checkbox" id="toggle-clash-isolate-context" checked style="accent-color: #f43f5e;" />
            <span>Isolate Pair on Focus</span>
          </label>
          <button id="btn-analyze-workspace-slf" class="btn-xs btn-outline" title="Evaluate Hosny et al. 4D Space Loading Factor (SLF) trade congestion per storey">Analyze SLF</button>
          <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.68rem; color: var(--text-muted); cursor: pointer;" title="Automatically update 3D SLF congestion zones as the 4D timeline scrubs">
            <input type="checkbox" id="clash-sync-4d-slf" style="accent-color: #f59e0b;" />
            <span>Sync SLF with 4D</span>
          </label>
        </div>
        <div id="clash-slf-summary" class="clash-scan-summary hidden" style="margin-top:0.35rem;"></div>
        <div id="clash-rules-container" class="clash-rules-container"></div>
        <div id="clash-scan-summary" class="clash-scan-summary"></div>
        <div id="clash-matrix-container" class="clash-matrix-wrap"></div>
        <div class="drawer-section-header" style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
          <span>Clash Results (<span id="clash-total-badge">0 Total</span>)</span>
          <select id="clash-severity-filter" aria-label="Filter Clashes by Severity" class="clash-status-select">
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="major">Major</option>
            <option value="clearance">Clearance</option>
          </select>
        </div>
        <div id="clash-results-list" class="clash-results-container thin-scrollbar"></div>
      </div>
    </div>

    <!-- 3. 6D Embodied Carbon & LCA Sustainability Drawer -->
    <div id="carbon-panel" class="enterprise-drawer hidden">
      <div class="drawer-header">
        <div class="drawer-title-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
          <h3>6D Embodied Carbon & LCA</h3>
        </div>
        <div class="drawer-header-actions">
          <span id="carbon-rating-grade" class="carbon-grade-badge grade-A">Grade A</span>
          <button class="btn-icon drawer-center-toggle-btn" data-target="carbon-panel" aria-label="Toggle Centralized Modal / Right Dock" title="Toggle Centralized Modal / Right Dock"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="3"/></svg></button>
          <button class="btn-icon drawer-close-btn" data-target="carbon-panel" aria-label="Close Carbon Drawer" title="Close Drawer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <div class="drawer-body thin-scrollbar">
        <div class="carbon-kpi-grid">
          <div class="kpi-card">
            <span class="kpi-label">Total Carbon</span>
            <span id="carbon-total-tonnes" class="kpi-val">0.0 tCO₂e</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Intensity</span>
            <span id="carbon-intensity-m2" class="kpi-val">0.0 kg/m²</span>
          </div>
        </div>
        <div class="carbon-savings-card">
          <span class="savings-title">🌿 Sustainable Opportunity</span>
          <span id="carbon-potential-savings" class="savings-val">-0.0 tCO₂e potential savings</span>
        </div>
        <div class="drawer-actions-bar">
          <button id="btn-toggle-carbon-heatmap" class="btn-md btn-accent flex-1">Toggle Heatmap</button>
        </div>
        <div class="drawer-section-header">
          <span>Material Substitutions (Simulator)</span>
        </div>
        <div id="carbon-materials-list" class="carbon-materials-container thin-scrollbar"></div>
      </div>
    </div>

    <!-- 4. AI BIM Copilot Chat Drawer -->
    <div id="copilot-panel" class="enterprise-drawer hidden">
      <div class="drawer-header">
        <div class="drawer-title-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-500)" stroke-width="2.2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/></svg>
          <h3>BIM AI Copilot</h3>
        </div>
        <div class="drawer-header-actions">
          <span class="drawer-status-tag tag-ai">Active</span>
          <button class="btn-icon drawer-center-toggle-btn" data-target="copilot-panel" aria-label="Toggle Centralized Modal / Right Dock" title="Toggle Centralized Modal / Right Dock"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="3"/></svg></button>
          <button class="btn-icon drawer-close-btn" data-target="copilot-panel" aria-label="Close Copilot Drawer" title="Close Drawer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <div class="copilot-quick-chips thin-scrollbar">
        <button class="copilot-chip-btn" data-query="Run clash audit between MEP and Structure">⚡ Clash Audit</button>
        <button class="copilot-chip-btn" data-query="Show carbon sustainability heatmap">🌿 6D Carbon</button>
        <button class="copilot-chip-btn" data-query="Select all walls">🧱 Select Walls</button>
        <button class="copilot-chip-btn" data-query="Isolate all columns">🏛️ Columns</button>
        <button class="copilot-chip-btn" data-query="Clear all selections and heatmaps">🧹 Clear All</button>
      </div>
      <div class="drawer-body chat-drawer-body">
        <div id="copilot-chat-messages" class="copilot-messages-box thin-scrollbar"></div>
        <div class="copilot-input-bar">
          <button id="btn-copilot-voice" class="btn-icon" title="Voice dictation prompt" style="color: var(--accent-500);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          </button>
          <input type="text" id="copilot-user-input" placeholder="Ask AI Copilot to select, isolate, clash test, or inspect..." />
          <button id="btn-copilot-send" class="btn-accent btn-sm">Send</button>
        </div>
      </div>
    </div>

    <!-- 5. Live Collaboration Panel -->
    <div id="collab-panel" class="enterprise-drawer hidden">
      <div class="drawer-header">
        <div class="drawer-title-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <h3>Live Workstation Peers</h3>
        </div>
        <div class="drawer-header-actions">
          <span id="collab-user-count-badge" class="drawer-status-tag">4 Online</span>
          <button class="btn-icon drawer-center-toggle-btn" data-target="collab-panel" aria-label="Toggle Centralized Modal / Right Dock" title="Toggle Centralized Modal / Right Dock"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="3"/></svg></button>
          <button class="btn-icon drawer-close-btn" data-target="collab-panel" aria-label="Close Collaboration Drawer" title="Close Drawer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>

      <!-- Live Peers On/Off Control Bar -->
      <div class="collab-live-toggle-bar">
        <div class="collab-live-toggle-info">
          <span id="collab-live-status-dot" class="collab-live-dot is-online"></span>
          <span id="collab-live-status-text">Live Peers: ON · Syncing Avatars</span>
        </div>
        <label class="toggle-switch" title="Turn Live Peers On or Off">
          <input type="checkbox" id="toggle-live-peers" aria-label="Toggle Live Peers On or Off" checked />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <!-- Profile & Cross-Device Session Strip -->
      <div class="collab-profile-bar">
        <input type="text" id="collab-profile-name" class="collab-mini-input" placeholder="Your Name" aria-label="Your Display Name" />
        <input type="text" id="collab-profile-role" class="collab-mini-input" placeholder="Role" aria-label="Your Project Role" />
        <label class="collab-demo-filter" title="Hide seeded demo coworkers to show only real peers">
          <input type="checkbox" id="toggle-hide-demo-peers" />
          <span>Hide Demo</span>
        </label>
      </div>
      <div class="collab-relay-bar">
        <input type="text" id="collab-room-id" class="collab-mini-input" placeholder="Room ID" aria-label="Collaboration Room ID" style="max-width: 112px;" />
        <input type="text" id="collab-ws-url" class="collab-mini-input" placeholder="wss://relay.example.com (optional)" aria-label="WebSocket Relay URL" />
        <button id="btn-collab-ws-connect" class="btn-xs btn-outline" title="Connect or Disconnect WebSocket Relay">Relay</button>
        <button id="btn-collab-rtc-p2p" class="btn-xs btn-outline" title="Serverless WebRTC P2P Connect">P2P</button>
      </div>

      <!-- Quick Action Ribbon -->
      <div class="collab-toolbar-ribbon">
        <button id="btn-follow-host" class="btn-xs btn-outline flex-1">Follow Presenter</button>
        <button id="btn-collab-ping-loc" class="btn-xs btn-outline" title="Drop a 3D Beacon at your current view">📍 Ping 3D</button>
        <button id="btn-collab-mic-toggle" class="btn-xs btn-outline" title="Toggle Microphone Audio">🎙️ Mute</button>
        <button id="btn-collab-copy-invite" class="btn-xs btn-accent" title="Copy Collaboration Room Link">🔗 Invite</button>
      </div>

      <!-- Tabs Navigation -->
      <div class="collab-tab-nav">
        <button class="collab-tab-btn active" data-collab-tab="peers">Active Peers</button>
        <button class="collab-tab-btn" data-collab-tab="chat">Live Spatial Chat</button>
      </div>

      <div class="drawer-body thin-scrollbar" style="display: flex; flex-direction: column; flex: 1;">
        <!-- Tab 1: Peers List -->
        <div id="collab-tab-peers-content" class="collab-tab-pane active">
          <div id="collab-users-list" class="collab-users-container"></div>
        </div>

        <!-- Tab 2: Live Chat Stream -->
        <div id="collab-tab-chat-content" class="collab-tab-pane hidden" style="display: flex; flex-direction: column; flex: 1; height: 100%;">
          <div id="collab-chat-messages" class="collab-chat-box thin-scrollbar"></div>
          <div class="collab-chat-input-bar">
            <input type="text" id="collab-chat-input" placeholder="Type a message to peers..." />
            <button id="btn-collab-chat-send" class="btn-accent btn-xs">Send</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. BCF 2.1/3.0 Issue Coordination Drawer -->
    <div id="bcf-issues-panel" class="enterprise-drawer hidden">
      <div class="drawer-header">
        <div class="drawer-title-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A855F7" stroke-width="2.2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/></svg>
          <h3>BCF Issue Coordination</h3>
        </div>
        <div class="drawer-header-actions">
          <label id="btn-import-bcf-trigger" class="btn-drawer-action" title="Import BCF Package (.bcfzip / .bcf / .json)" style="background: var(--color-info-subtle); border: 1px solid var(--color-info); color: var(--text-primary); font-size: 0.65rem; font-weight: 700; padding: 0.25rem 0.55rem; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Import
            <input type="file" id="btn-import-bcf-input" aria-label="Import BCF Package File" accept=".bcfzip,.bcf,.json" style="display: none;" />
          </label>
          <button id="btn-export-bcf-json" class="btn-drawer-action" title="Export Standard BCF Package (.bcfzip / .json)" style="background: var(--color-purple-subtle); border: 1px solid var(--color-purple); color: var(--text-primary); font-size: 0.65rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export BCF</button>
          <button class="btn-icon drawer-center-toggle-btn" data-target="bcf-issues-panel" aria-label="Toggle Centralized Modal / Right Dock" title="Toggle Centralized Modal / Right Dock"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="3"/></svg></button>
          <button class="btn-icon drawer-close-btn" data-target="bcf-issues-panel" aria-label="Close BCF Issues Drawer" title="Close Drawer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <div class="drawer-body thin-scrollbar">
        <div class="drawer-section-card">
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <input type="text" id="bcf-new-title" placeholder="Issue Title (e.g. Duct clash with W12 beam)" style="width: 100%; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); padding: 0.4rem 0.6rem; border-radius: 4px; font-size: 0.72rem;" />
            <div style="display: flex; gap: 0.4rem;">
              <select id="bcf-new-priority" aria-label="BCF Issue Priority" style="flex: 1; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); padding: 0.35rem 0.5rem; border-radius: 4px; font-size: 0.7rem;">
                <option value="Critical">Critical Priority</option>
                <option value="Major">Major Priority</option>
                <option value="Normal" selected>Normal Priority</option>
                <option value="Minor">Minor Priority</option>
              </select>
              <button id="btn-create-bcf-issue" class="btn-accent btn-xs" style="padding: 0 0.8rem; font-weight: 800;">+ Capture View</button>
              <button type="button" id="btn-bcf-photo-snag" class="bk-btn bk-btn--sm" title="Capture Jobsite Camera Photo &amp; Pin to BCF Issue">📷 Photo</button>
            </div>
          </div>
        </div>
        <div class="drawer-section-header" style="margin-top: 0.8rem;">
          <span>Active Coordination Issues (<span id="bcf-issue-count-badge">2</span>)</span>
        </div>
        <div id="bcf-issues-list" class="bcf-issues-list" style="display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.5rem;"></div>
      </div>
    </div>

    <!-- 7. 5D Project Cost Control Drawer -->
    <div id="cost-control-panel" class="enterprise-drawer hidden">
      <div class="drawer-header">
        <div class="drawer-title-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <h3>5D Project Cost Control</h3>
        </div>
        <div class="drawer-header-actions">
          <span id="drawer-cost-currency-badge" class="carbon-grade-badge grade-A" style="background: var(--color-success-subtle); color: var(--color-success); border: 1px solid var(--color-success-border);">USD $</span>
          <button class="btn-icon drawer-center-toggle-btn" data-target="cost-control-panel" aria-label="Toggle Centralized Modal / Right Dock" title="Toggle Centralized Modal / Right Dock"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="3"/></svg></button>
          <button class="btn-icon drawer-close-btn" data-target="cost-control-panel" aria-label="Close Cost Control Drawer" title="Close Drawer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <div class="drawer-body thin-scrollbar">
        <!-- Budget & EVM KPI Highlights -->
        <div class="drawer-section-card" style="border-left: 3px solid var(--color-success);">
          <div style="font-family: var(--font-mono); font-size: 0.62rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
            <span>Cumulative 5D Budget</span>
            <span id="drawer-cost-elements-count" style="font-size: 0.58rem; background: var(--accent-500); color: var(--accent-btn-text); font-weight: 800; padding: 0.05rem 0.35rem; border-radius: 2px;">0 items</span>
          </div>
          <div style="font-family: var(--font-mono); font-size: 1.3rem; font-weight: 900; color: var(--color-success); line-height: 1.2;" id="drawer-cost-grand-total">$0.00</div>

          <!-- Visual Trade Distribution Bar -->
          <div style="display: flex; flex-direction: column; gap: 0.25rem; margin-top: 0.2rem;">
            <div style="display: flex; height: 8px; border-radius: 2px; overflow: hidden; border: 1px solid var(--border-strong);">
              <div id="drawer-bar-trade-concrete" title="Structural Concrete" style="width: 0%; background: var(--color-info);"></div>
              <div id="drawer-bar-trade-steel" title="Structural Steel" style="width: 0%; background: var(--color-warning);"></div>
              <div id="drawer-bar-trade-mep" title="MEP & Services" style="width: 0%; background: var(--color-success);"></div>
              <div id="drawer-bar-trade-finishes" title="Finishes & Facade" style="width: 0%; background: var(--color-purple);"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.55rem; font-weight: 700; color: var(--text-muted); flex-wrap: wrap; gap: 0.2rem;">
              <span style="display: flex; align-items: center; gap: 0.2rem;"><span style="width: 6px; height: 6px; background: var(--color-info); border-radius: 50%;"></span>Concrete</span>
              <span style="display: flex; align-items: center; gap: 0.2rem;"><span style="width: 6px; height: 6px; background: var(--color-warning); border-radius: 50%;"></span>Steel</span>
              <span style="display: flex; align-items: center; gap: 0.2rem;"><span style="width: 6px; height: 6px; background: var(--color-success); border-radius: 50%;"></span>MEP</span>
              <span style="display: flex; align-items: center; gap: 0.2rem;"><span style="width: 6px; height: 6px; background: var(--color-purple); border-radius: 50%;"></span>Finishes</span>
            </div>
          </div>
        </div>

        <!-- Cost Action Toolbar -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; margin-top: 0.4rem;">
          <button type="button" class="btn-cost-action rates" id="drawer-btn-open-cost-rates"
            onclick="window.openCostRateModal && window.openCostRateModal()"
            title="Edit custom unit rates, volume/area multipliers, and project currency">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span>Rates & Currency</span>
          </button>
          <button type="button" class="btn-cost-action boq" id="drawer-btn-export-boq"
            title="Export complete Bills of Quantities as CSV">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export BOQ</span>
          </button>
          <label class="btn-cost-action boq" for="drawer-import-cost-csv" style="cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.3rem; margin: 0; padding: 0.45rem 0.4rem;" title="Import 4D/5D Schedule (Excel .xlsx / .xls or CSV)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>Import XLSX / CSV</span>
            <input type="file" id="drawer-import-cost-csv" accept=".xlsx,.xls,.csv" class="hidden" />
          </label>
          <button type="button" class="btn-cost-action rates" id="drawer-btn-demo-schedule"
            title="Load CapeStone 4D/5D Sample Schedule (1,356 elements, $17.9M)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span>Demo CapeStone</span>
          </button>
          <button type="button" class="btn-cost-action report" id="drawer-btn-exec-report"
            title="Generate Executive 4D/5D Twin Report (Print & PDF)"
            style="grid-column: span 2; background: linear-gradient(135deg, var(--accent-glow2), var(--color-info-subtle)); border: 1px solid var(--accent-glow); color: var(--text-primary); font-weight: 700;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span>Executive Twin Report (Print / PDF)</span>
          </button>
          <button type="button" class="btn-cost-action rates" id="drawer-btn-open-evm"
            title="Open Dedicated Earned Value Management (EVM) Control Suite"
            style="grid-column: span 2; background: var(--color-warning-subtle); border: 1px solid var(--color-warning-border); color: var(--color-warning); font-weight: 700;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            <span>Earned Value Management (EVM) Suite</span>
          </button>
        </div>

        <button type="button" class="btn-cost-action ids" id="drawer-btn-run-ids"
          style="width: 100%; margin-top: 0.35rem;"
          title="Validate BuildingSMART IDS data readiness">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <span>Validate IDS 4D/5D Readiness</span>
        </button>

        <!-- Rule-Book Classification Standard, GAEB X83 Export & DDC Quality Gate -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; margin-top: 0.4rem;">
          <select id="drawer-cost-standard" class="clash-status-select" aria-label="Cost Classification Standard" title="Active BOQ Classification Rule-Book">
            <option value="DIN276" selected>DIN 276 (DACH)</option>
            <option value="UNICLASS">Uniclass 2015 (UK)</option>
            <option value="MASTERFORMAT">CSI MasterFormat</option>
          </select>
          <button type="button" class="btn-cost-action boq" id="drawer-btn-export-gaeb" title="Export Hierarchical BOQ as GAEB DA XML (.X83)">
            <span>Export GAEB .X83</span>
          </button>
          <label class="btn-cost-action rates" for="drawer-import-rate-catalog" style="cursor: pointer; display: flex; align-items: center; justify-content: center; margin: 0;" title="Import custom CWICR / regional cost catalog (.csv)">
            <span>Import Rate Catalog</span>
            <input type="file" id="drawer-import-rate-catalog" accept=".csv" class="hidden" />
          </label>
          <button type="button" class="btn-cost-action ids" id="drawer-btn-quality-audit" title="Run 6-Category BIM Data Quality & Traffic-Light BOQ Audit">
            <span>Model &amp; BOQ Audit</span>
          </button>
        </div>
        <div id="drawer-quality-summary" class="clash-scan-summary hidden" style="margin-top:0.35rem;"></div>
        <div id="drawer-audit-drilldown" class="audit-drilldown-card hidden" style="margin-top:0.4rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; margin-bottom:0.3rem;">
            <span style="font-size:0.68rem; font-weight:700; color:var(--text-primary);">QA &amp; BOQ Drill-Down</span>
            <button type="button" id="drawer-btn-export-qa-csv" class="btn-xs btn-outline" title="Download 6-category BIM Quality Audit CSV">Export QA CSV</button>
          </div>
          <div id="drawer-audit-issues-list" class="audit-drilldown-list thin-scrollbar"></div>
          <div style="font-size:0.66rem; font-weight:700; color:var(--text-muted); margin-top:0.45rem; margin-bottom:0.25rem;">QTO Provenance Source Switcher</div>
          <div id="drawer-boq-provenance-list" class="audit-drilldown-list thin-scrollbar"></div>
        </div>

        <!-- Category Cost Breakdown Section -->
        <div class="drawer-section-header" style="margin-top: 0.75rem;">
          <span>Category Breakdown</span>
        </div>
        <div id="drawer-cost-breakdown-container" style="width: 100%; margin-top: 0.35rem;"></div>

        <!-- 4D/5D Earned Value Management (EVM) S-Curve -->
        <div id="drawer-scurve-container" style="width: 100%; margin-top: 0.35rem;"></div>
      </div>
    </div>

    <!-- 7b. Earned Value Management (EVM) Control Suite Drawer -->
    <div id="evm-panel" class="enterprise-drawer hidden">
      <div class="drawer-header">
        <div class="drawer-title-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2.2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
          <h3>Earned Value Management (EVM)</h3>
        </div>
        <div class="drawer-header-actions">
          <span id="evm-status-badge" class="carbon-grade-badge grade-A" style="background: var(--color-warning-subtle); color: var(--color-warning); border: 1px solid var(--color-warning-border);">ON TRACK • SPI 1.00 | CPI 1.00</span>
          <button class="btn-icon drawer-center-toggle-btn" data-target="evm-panel" aria-label="Toggle Centralized Modal / Right Dock" title="Toggle Centralized Modal / Right Dock"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="3"/></svg></button>
          <button class="btn-icon drawer-close-btn" data-target="evm-panel" aria-label="Close EVM Drawer" title="Close Drawer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <div class="drawer-body thin-scrollbar">
        <!-- ANSI 748-B VAR Alert Banner (Active when Tier 1 or Tier 2 threshold breached) -->
        <div id="evm-var-alert-banner" class="hidden" style="margin-bottom: 0.5rem; padding: 0.45rem 0.6rem; border-radius: 6px; border: 1px solid var(--color-danger); background: var(--color-danger-subtle); display: none; align-items: flex-start; gap: 0.5rem;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.2" style="flex-shrink: 0; margin-top: 1px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div style="flex: 1; font-size: 0.62rem;">
            <div id="evm-var-banner-title" style="font-weight: 800; color: var(--color-danger); text-transform: uppercase;">ANSI 748-B TIER 2 BREACH (VAR REQUIRED)</div>
            <div id="evm-var-banner-desc" style="color: var(--text-muted); margin-top: 0.15rem; line-height: 1.3;">Cost Variance breached ±10% / $25k threshold. Mandatory CPR Format 5 filing required.</div>
            <button type="button" id="btn-evm-quick-var-modal" class="btn-gantt-drawer-action" style="margin-top: 0.35rem; font-size: 0.58rem; padding: 0.15rem 0.5rem; border-color: var(--color-danger); color: var(--color-danger);">
              Open CPR Format 5 Report (VAR)
            </button>
          </div>
        </div>

        <!-- 1. Executive Performance Overview (BAC, PV, EV, AC, SV, CV) -->
        <div class="drawer-section-card" style="border-left: 3px solid var(--color-warning);">
          <div style="font-family: var(--font-mono); font-size: 0.62rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
            <span>Project Baseline & Value (BAC)</span>
            <span id="evm-val-progress" style="font-size: 0.58rem; background: var(--color-info-subtle); color: var(--color-info); font-weight: 800; padding: 0.05rem 0.35rem; border-radius: 2px;">0%</span>
          </div>
          <div style="font-family: var(--font-mono); font-size: 1.25rem; font-weight: 900; color: var(--color-warning); line-height: 1.2;" id="evm-val-bac">$0.00</div>

          <!-- 4-Grid Core EVM Parameters -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem; margin-top: 0.45rem;">
            <div style="background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: 4px; padding: 0.35rem 0.45rem;">
              <div style="font-size: 0.55rem; color: var(--color-info); font-weight: 700; text-transform: uppercase;">Planned Value (PV)</div>
              <div id="evm-val-pv" style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 800; color: var(--text-primary);">$0.00</div>
            </div>
            <div style="background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: 4px; padding: 0.35rem 0.45rem;">
              <div style="font-size: 0.55rem; color: var(--color-success); font-weight: 700; text-transform: uppercase;">Earned Value (EV)</div>
              <div id="evm-val-ev" style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 800; color: var(--text-primary);">$0.00</div>
            </div>
            <div style="background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: 4px; padding: 0.35rem 0.45rem;">
              <div style="font-size: 0.55rem; color: var(--color-warning); font-weight: 700; text-transform: uppercase;">Actual Cost (AC)</div>
              <div id="evm-val-ac" style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 800; color: var(--text-primary);">$0.00</div>
            </div>
            <div style="background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: 4px; padding: 0.35rem 0.45rem;">
              <div style="font-size: 0.55rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Schedule Var (SV)</div>
              <div id="evm-val-sv" style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 800; color: var(--color-success);">$0.00</div>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.35rem; font-size: 0.58rem; color: var(--text-muted);">
            <span>Cost Variance (CV): <strong id="evm-val-cv" style="font-family: var(--font-mono); color: var(--color-success);">$0.00</strong></span>
          </div>
        </div>

        <!-- 2. Performance Indices & Forecasting (SPI, CPI, EAC, VAC, TCPI) -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.35rem; margin-top: 0.45rem;">
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.4rem; text-align: center;">
            <div style="font-size: 0.55rem; color: var(--text-muted); font-weight: 700;">SPI (Sched Index)</div>
            <div id="evm-val-spi" style="font-family: var(--font-mono); font-size: 1.05rem; font-weight: 900; color: var(--color-info);">1.00</div>
            <div style="font-size: 0.5rem; color: var(--text-muted);">EV / PV</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.4rem; text-align: center;">
            <div style="font-size: 0.55rem; color: var(--text-muted); font-weight: 700;">CPI (Cost Index)</div>
            <div id="evm-val-cpi" style="font-family: var(--font-mono); font-size: 1.05rem; font-weight: 900; color: var(--color-success);">1.00</div>
            <div style="font-size: 0.5rem; color: var(--text-muted);">EV / AC</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.4rem; text-align: center;">
            <div style="font-size: 0.55rem; color: var(--text-muted); font-weight: 700;">TCPI (To-Complete)</div>
            <div id="evm-val-tcpi" style="font-family: var(--font-mono); font-size: 1.05rem; font-weight: 900; color: var(--color-warning);">1.00</div>
            <div style="font-size: 0.48rem; display: flex; flex-direction: column; gap: 1px; margin-top: 2px;">
              <span id="evm-tcpi-bac-pill" style="color: var(--color-success);">BAC: 1.00</span>
              <span id="evm-tcpi-eac-pill" style="color: var(--color-info);">EAC: 1.00</span>
            </div>
          </div>
        </div>

        <!-- EAC Model Selection & VAC -->
        <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.45rem; margin-top: 0.35rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <span style="font-size: 0.58rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">EAC Forecasting Formula</span>
            <select id="select-evm-eac-model" aria-label="EAC Forecasting Model" title="EAC Forecasting Model" style="background: var(--bg-input); border: 1px solid var(--border-subtle); color: var(--text-primary); font-size: 0.58rem; padding: 0.15rem 0.35rem; border-radius: 4px; outline: none; cursor: pointer;">
              <option value="composite">Composite (CPI × SPI)</option>
              <option value="typical">Typical (BAC / CPI)</option>
              <option value="atypical">Atypical (AC + BAC - EV)</option>
              <option value="weighted">Weighted (0.80 CPI + 0.20 SPI)</option>
            </select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem;">
            <div>
              <div style="font-size: 0.52rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Estimate At Completion (EAC)</div>
              <div id="evm-val-eac" style="font-family: var(--font-mono); font-size: 0.95rem; font-weight: 800; color: var(--text-primary);">$0.00</div>
            </div>
            <div>
              <div style="font-size: 0.52rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Variance At Completion (VAC)</div>
              <div id="evm-val-vac" style="font-family: var(--font-mono); font-size: 0.95rem; font-weight: 800; color: var(--color-success);">$0.00</div>
            </div>
          </div>
          <div id="evm-eac-formula-desc" style="font-size: 0.52rem; color: var(--text-muted); margin-top: 0.3rem; border-top: 1px dashed var(--border-subtle); padding-top: 0.25rem;">
            EAC = AC + (BAC - EV) / (CPI × SPI) • Accounts for compounding effect of schedule delay on project costs.
          </div>
        </div>

        <!-- 3. Earned Schedule (ES) Time-Based Metrics (Lipke / PMI Standard Box 3-1) -->
        <div class="drawer-section-header" style="margin-top: 0.65rem;">
          <span>Earned Schedule (ES) Time-Based Metrics (PMI Box 3-1)</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.3rem; margin-top: 0.35rem;">
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.35rem; text-align: center;">
            <div style="font-size: 0.52rem; color: var(--text-muted); font-weight: 700;">SV(t) Days</div>
            <div id="evm-val-es-svt" style="font-family: var(--font-mono); font-size: 0.82rem; font-weight: 900; color: var(--color-success);">0.0d</div>
            <div style="font-size: 0.48rem; color: var(--text-muted);">ES − AT</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.35rem; text-align: center;">
            <div style="font-size: 0.52rem; color: var(--text-muted); font-weight: 700;">SPI(t)</div>
            <div id="evm-val-es-spit" style="font-family: var(--font-mono); font-size: 0.82rem; font-weight: 900; color: var(--color-info);">1.00</div>
            <div style="font-size: 0.48rem; color: var(--text-muted);">ES / AT</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.35rem; text-align: center;">
            <div style="font-size: 0.52rem; color: var(--text-muted); font-weight: 700;">EAC(t) Days</div>
            <div id="evm-val-es-eact" style="font-family: var(--font-mono); font-size: 0.82rem; font-weight: 900; color: var(--text-primary);">0d</div>
            <div style="font-size: 0.48rem; color: var(--text-muted);">PD / SPI(t)</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.35rem; text-align: center;">
            <div style="font-size: 0.52rem; color: var(--text-muted); font-weight: 700;">Est Finish</div>
            <div id="evm-val-es-target-finish" style="font-family: var(--font-mono); font-size: 0.65rem; font-weight: 800; color: var(--color-warning); margin-top: 3px;">--</div>
            <div style="font-size: 0.48rem; color: var(--text-muted);">Projected</div>
          </div>
        </div>

        <!-- 4. Interactive Visualization Viewport (S-Curve & APM Bulls-Eye Quadrant) -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
          <div class="drawer-section-header" style="margin: 0;">
            <span id="evm-chart-section-title">EVM Visual Analytics</span>
          </div>
          <div style="display: flex; gap: 0.2rem; background: var(--bg-input); padding: 2px; border-radius: 5px; border: 1px solid var(--border-subtle);">
            <button type="button" id="btn-evm-view-scurve" class="btn-gantt-drawer-action" style="font-size: 0.58rem; padding: 0.15rem 0.45rem; border: none; background: var(--color-info); color: var(--accent-btn-text); font-weight: 700; border-radius: 3px; cursor: pointer;">S-Curve</button>
            <button type="button" id="btn-evm-view-bullseye" class="btn-gantt-drawer-action" style="font-size: 0.58rem; padding: 0.15rem 0.45rem; border: none; background: transparent; color: var(--text-muted); border-radius: 3px; cursor: pointer;">APM Bulls-Eye</button>
          </div>
        </div>
        <div id="evm-chart-viewport" style="width: 100%; margin-top: 0.35rem;">
          <div id="evm-scurve-chart-container" style="width: 100%;"></div>
        </div>

        <!-- 5. Delay & Liquidated Damages Financial Exposure -->
        <div class="drawer-section-header" style="margin-top: 0.75rem;">
          <span>Delay & Financial Claim Exposure</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem; margin-top: 0.35rem;">
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.4rem;">
            <div style="font-size: 0.55rem; color: var(--text-muted); font-weight: 700;">Project Slippage</div>
            <div id="evm-val-slippage" style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 800; color: var(--color-danger);">0 Days</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.4rem;">
            <div style="font-size: 0.55rem; color: var(--text-muted); font-weight: 700;">Prolongation Overhead</div>
            <div id="evm-val-prolongation" style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 800; color: var(--text-primary);">$0.00</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.4rem;">
            <div style="font-size: 0.55rem; color: var(--text-muted); font-weight: 700;">Penalties (Liquidated)</div>
            <div id="evm-val-penalties" style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 800; color: var(--text-primary);">$0.00</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.4rem;">
            <div style="font-size: 0.55rem; color: var(--color-danger); font-weight: 700;">Total Delay Exposure</div>
            <div id="evm-val-total-impact" style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 800; color: var(--color-danger);">$0.00</div>
          </div>
        </div>

        <!-- 6. What-If Delay Sensitivity Simulator -->
        <div style="margin-top: 0.5rem; background: var(--color-warning-subtle); border: 1px dashed var(--color-warning-border); border-radius: 6px; padding: 0.45rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.62rem; font-weight: 700; color: var(--color-warning); margin-bottom: 0.25rem;">
            <span>What-If Delay Sensitivity Simulator</span>
            <span id="evm-sim-delay-display" style="font-family: var(--font-mono); font-size: 0.62rem; color: var(--text-primary);">+0 days</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="range" id="input-evm-delay-sim" aria-label="Simulate Schedule Delay Days" title="Simulate Schedule Delay Days" min="0" max="60" step="5" value="0" style="flex: 1; accent-color: var(--color-warning); cursor: pointer;" />
            <button type="button" id="btn-evm-reset-sim" class="btn-gantt-drawer-action" style="font-size: 0.6rem; padding: 0.15rem 0.4rem;">Reset</button>
          </div>
        </div>

        <!-- 7. Critical Delayed Tasks Watchlist -->
        <div class="drawer-section-header" style="margin-top: 0.75rem;">
          <span>Critical Path Delayed Activities</span>
        </div>
        <div id="evm-delayed-tasks-container" style="width: 100%; margin-top: 0.35rem;"></div>

        <!-- 8. EVM Action Toolbar -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; margin-top: 0.75rem;">
          <button type="button" class="btn-cost-action boq" id="btn-export-evm-csv"
            title="Export complete Earned Value Management (EVM) Audit Ledger to CSV">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>EVM Audit CSV</span>
          </button>
          <button type="button" class="btn-cost-action boq" id="btn-export-cpr1-csv"
            title="Export ANSI/EIA 748-B CPR Format 1 (WBS Ledger CSV)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>CPR Format 1 (WBS)</span>
          </button>
          <button type="button" class="btn-cost-action report" id="btn-open-cpr5-modal"
            title="Generate ANSI/EIA 748-B CPR Format 5 Variance Analysis Report (VAR)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>CPR Format 5 (VAR)</span>
          </button>
          <button type="button" class="btn-cost-action rates" id="btn-evm-open-5d-cost"
            title="Open 5D Cost Control Drawer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>5D Cost Drawer</span>
          </button>
          <button type="button" class="btn-cost-action report" id="btn-evm-exec-report"
            title="Generate Executive 4D/5D Twin Report (Print & PDF)"
            style="grid-column: span 2; background: linear-gradient(135deg, var(--color-warning-subtle), var(--color-info-subtle)); border: 1px solid var(--color-warning-border); color: var(--text-primary); font-weight: 700;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span>Executive Twin Report (Print / PDF)</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 8. GeoBIM GIS & Site Georeference Drawer -->
    <div id="gis-panel" class="enterprise-drawer hidden">
      <div class="drawer-header">
        <div class="drawer-title-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          <h3>GeoBIM & Site Georeference</h3>
        </div>
        <div class="drawer-header-actions">
          <span id="gis-utm-badge" class="carbon-grade-badge grade-A" style="background: var(--color-cyan-subtle); color: var(--color-cyan); border: 1px solid var(--color-cyan-border);">Zone 54S</span>
          <button class="btn-icon drawer-center-toggle-btn" data-target="gis-panel" aria-label="Toggle Centralized Modal / Right Dock" title="Toggle Centralized Modal / Right Dock"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="3"/></svg></button>
          <button class="btn-icon drawer-close-btn" data-target="gis-panel" aria-label="Close GIS Drawer" title="Close Drawer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <div class="drawer-body thin-scrollbar">
        <!-- Site Georeferencing Card -->
        <div class="drawer-section-card gis-card-cyan">
          <div class="gis-header-row">
            <span class="gis-card-title">World Geodetic Datum (WGS84)</span>
            <span id="gis-dms-badge" class="gis-telemetry-pill">35°41'22"N 139°41'30"E</span>
          </div>

          <!-- Global Address / Landmark Geocoding Search -->
          <div style="position: relative;">
            <label for="gis-search-address" class="gis-field-label">Search Global Address or Landmark:</label>
            <div style="display: flex; gap: 0.4rem;">
              <div style="position: relative; flex: 1;">
                <input type="text" id="gis-search-address" class="gis-input" placeholder="e.g. Eiffel Tower, Marina Bay Sands..." />
                <div id="gis-search-suggestions" class="hidden" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 6px; max-height: 180px; overflow-y: auto; z-index: 1000; box-shadow: var(--shadow-panel);"></div>
              </div>
              <button type="button" id="gis-btn-search" class="btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.65rem; display: flex; align-items: center; gap: 0.3rem; white-space: nowrap;" title="Search OpenStreetMap Geocoder">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>Find</span>
              </button>
            </div>
          </div>

          <!-- Presets Dropdown -->
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <label for="gis-preset-select" class="gis-field-label" style="margin-bottom: 0; white-space: nowrap;">Preset City:</label>
            <select id="gis-preset-select" class="gis-select" style="flex: 1;">
              <option value="tokyo">Tokyo, Japan (Default IFC)</option>
              <option value="london">London, UK</option>
              <option value="san_francisco">San Francisco, USA</option>
              <option value="new_york">New York, USA</option>
              <option value="dubai">Dubai, UAE</option>
              <option value="singapore">Singapore</option>
              <option value="sydney">Sydney, Australia</option>
            </select>
          </div>

          <!-- Interactive 2D World Location Mini-Map -->
          <div style="position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span class="gis-field-label" style="margin-bottom: 0;">Site Location Pin Picker:</span>
              <div style="display: flex; gap: 0.3rem; align-items: center;">
                <button type="button" id="gis-minimap-zoom-in" class="btn-icon" style="width: 24px; height: 24px; font-size: 0.85rem; font-weight: 700; line-height: 1;" title="Mini-Map Zoom In">+</button>
                <button type="button" id="gis-minimap-zoom-out" class="btn-icon" style="width: 24px; height: 24px; font-size: 0.85rem; font-weight: 700; line-height: 1;" title="Mini-Map Zoom Out">−</button>
                <button type="button" id="gis-btn-current-gps" class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.62rem; display: flex; align-items: center; gap: 0.25rem;" title="Query Device GPS / Geolocation">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
                  <span>My GPS</span>
                </button>
              </div>
            </div>
            <div style="position: relative; width: 100%; height: 140px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color); background: var(--bg-card); box-shadow: inset 0 2px 8px var(--shadow-sm);">
              <canvas id="gis-minimap-canvas" width="320" height="140" style="width: 100%; height: 100%; display: block; cursor: crosshair;"></canvas>
              <div style="position: absolute; bottom: 4px; left: 8px; font-size: 0.58rem; color: var(--text-secondary); pointer-events: none; text-shadow: 0 1px 3px var(--bg-app); font-family: var(--font-mono);">
                Click map to relocate Site Datum
              </div>
            </div>
          </div>

          <!-- Lat / Lon / Elev / True North Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem;">
            <div>
              <label for="gis-input-lat" class="gis-field-label">Latitude (°):</label>
              <input type="number" id="gis-input-lat" class="gis-input mono" step="0.000001" value="35.6762" />
            </div>
            <div>
              <label for="gis-input-lon" class="gis-field-label">Longitude (°):</label>
              <input type="number" id="gis-input-lon" class="gis-input mono" step="0.000001" value="139.6503" />
            </div>
            <div>
              <label for="gis-input-elev" class="gis-field-label">Elevation AMSL (m):</label>
              <input type="number" id="gis-input-elev" class="gis-input mono" step="0.1" value="40.0" />
            </div>
            <div>
              <label for="gis-input-north" class="gis-field-label">True North Angle (°):</label>
              <input type="number" id="gis-input-north" class="gis-input mono" step="0.5" value="0.0" />
            </div>
          </div>

          <!-- True North Rotation Slider & Camera Alignment -->
          <div style="display: flex; flex-direction: column; gap: 0.45rem; margin-top: 0.35rem; padding-top: 0.55rem; border-top: 1px dashed var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label style="font-size: 0.68rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 0.35rem; cursor: pointer;">
                <input type="checkbox" id="gis-toggle-compass" aria-label="3D True North Ground Compass" title="3D True North Ground Compass" style="accent-color: var(--color-cyan);" />
                <span>3D True North Ground Compass</span>
              </label>
              <span id="gis-north-badge" class="gis-telemetry-pill">0.0° TN</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 0.62rem; color: var(--text-muted); white-space: nowrap;">Angle:</span>
              <input type="range" id="gis-slider-north" aria-label="True North Orientation Angle" title="True North Orientation Angle" min="0" max="360" step="0.5" value="0" style="flex: 1; accent-color: var(--color-cyan);" />
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.35rem;">
              <button type="button" id="gis-btn-align-true-north" class="btn-cost-action rates" style="font-size: 0.62rem; padding: 0.35rem 0.35rem;" title="Align Camera Orientation to True North">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
                <span>Align North</span>
              </button>
              <button type="button" id="gis-btn-focus-compass" class="btn-cost-action rates" style="font-size: 0.62rem; padding: 0.35rem 0.35rem; border-color: var(--color-cyan-border); color: var(--color-cyan);" title="Frame Camera Directly to True North Compass Rose">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                <span>View Compass</span>
              </button>
              <button type="button" id="gis-btn-align-proj-north" class="btn-cost-action boq" style="font-size: 0.62rem; padding: 0.35rem 0.35rem;" title="Align Camera Orientation to Project North (0°)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>Project North</span>
              </button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem; margin-top: 0.3rem;">
            <button type="button" id="gis-btn-apply-coords" class="btn-cost-action rates" style="border-color: var(--color-cyan-border); color: var(--color-cyan); padding: 0.4rem 0.6rem;" title="Update Georeference Datum">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Apply Datum</span>
            </button>
            <button type="button" id="gis-btn-align-sun" class="btn-cost-action boq" style="padding: 0.4rem 0.6rem;" title="Align Directional Sun Light to NOAA Solar Position">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              <span>Align Sun</span>
            </button>
          </div>
        </div>

        <!-- 3D Ground Basemap Settings -->
        <div class="drawer-section-header" style="margin-top: 0.75rem;">
          <span>3D Ground Basemap Plane</span>
        </div>

        <div class="drawer-section-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label style="font-size: 0.68rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 0.35rem; cursor: pointer;">
              <input type="checkbox" id="gis-toggle-basemap" aria-label="Enable 3D Satellite / Map Surface" title="Enable 3D Satellite / Map Surface" style="accent-color: var(--color-cyan);" />
              <span>Enable 3D Satellite / Map Surface</span>
            </label>
            <span class="gis-telemetry-pill" id="gis-basemap-status" style="color: var(--text-muted); background: var(--bg-input); border-color: var(--border-color);">Disabled</span>
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <label for="gis-select-provider" class="gis-field-label" style="margin-bottom: 0; white-space: nowrap;">Tile Provider:</label>
            <select id="gis-select-provider" class="gis-select" style="flex: 1;">
              <option value="satellite">Satellite Aerial (ArcGIS World Imagery)</option>
              <option value="streets">OpenStreetMap (Standard)</option>
              <option value="dark">CartoDB Dark Canvas (Modern BIM)</option>
              <option value="topo">OpenTopoMap (Contour / Topography)</option>
            </select>
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <label for="gis-select-resolution" class="gis-field-label" style="margin-bottom: 0; white-space: nowrap;">Map Clarity / Res:</label>
            <select id="gis-select-resolution" class="gis-select" style="flex: 1;" title="Increase basemap canvas pixel density for sharper ground textures and aerial imagery">
              <option value="1024">Standard (1024 × 1024 · 1.0 MP)</option>
              <option value="2048" selected>High Clarity 2K (2048 × 2048 · 4.2 MP)</option>
              <option value="4096">Ultra-HD 4K (4096 × 4096 · 16.8 MP)</option>
            </select>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.35rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="gis-field-label" style="margin-bottom: 0;">Basemap Extent Radius:</span>
              <div style="display: flex; align-items: center; gap: 0.3rem;">
                <input type="number" id="gis-input-radius" class="gis-input mono" min="50" max="5000" step="50" value="400" style="width: 60px; padding: 0.2rem 0.35rem; text-align: right;" title="Direct numerical radius in meters" />
                <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);">m</span>
                <button type="button" id="gis-btn-frame-basemap" class="btn-icon" style="width: 24px; height: 24px; padding: 0; display: inline-flex; align-items: center; justify-content: center;" title="Frame 3D Camera to Full Basemap Extent">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2.2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                </button>
              </div>
            </div>
            <input type="range" id="gis-slider-radius" aria-label="Basemap Extent Radius Slider" title="Basemap Extent Radius Slider" min="50" max="3000" step="50" value="400" style="width: 100%; accent-color: var(--color-cyan);" />

            <!-- Quick Radius Presets -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.3rem; margin-top: 0.15rem;">
              <button type="button" class="gis-btn-radius-preset" data-radius="250" title="Site Extent (250m)">250m Site</button>
              <button type="button" class="gis-btn-radius-preset" data-radius="500" title="Area Extent (500m)">500m Area</button>
              <button type="button" class="gis-btn-radius-preset" data-radius="1000" title="Campus Extent (1 km)">1 km</button>
              <button type="button" class="gis-btn-radius-preset" data-radius="2000" title="District Extent (2 km)">2 km</button>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="gis-field-label" style="margin-bottom: 0;">Vertical Elevation Offset:</span>
              <span id="gis-elev-val" class="gis-telemetry-pill">-0.05 m</span>
            </div>
            <input type="range" id="gis-slider-elev" aria-label="Vertical Elevation Offset Slider" title="Vertical Elevation Offset Slider" min="-25" max="25" step="0.25" value="-0.05" style="width: 100%; accent-color: var(--color-cyan);" />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="gis-field-label" style="margin-bottom: 0;">Surface Opacity:</span>
              <span id="gis-opacity-val" class="gis-telemetry-pill">95%</span>
            </div>
            <input type="range" id="gis-slider-opacity" aria-label="Surface Opacity Slider" title="Surface Opacity Slider" min="0.1" max="1.0" step="0.05" value="0.95" style="width: 100%; accent-color: var(--color-cyan);" />
          </div>

          <!-- Cinematic Orbital Space Flight & Site Descent -->
          <button type="button" id="gis-btn-space-flight" class="btn-cost-action rates" style="width: 100%; margin-top: 0.35rem; display: flex; align-items: center; justify-content: center; gap: 0.45rem; padding: 0.45rem 0.75rem; font-size: 0.68rem; border-color: var(--color-cyan-border); color: var(--color-cyan);" title="Toggle Cinematic Space Orbit View and Site-Level Camera Descent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span id="gis-space-flight-text">Fly to Space Orbit</span>
          </button>
        </div>

        <!-- Model Placement on Map (Relocate BIM) -->
        <div class="drawer-section-header" style="margin-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
          <span>Model Placement on Map</span>
          <span id="gis-model-offset-badge" class="gis-telemetry-pill sky">Origin [0,0]</span>
        </div>

        <div class="drawer-section-card gis-card-sky">
          <div style="font-size: 0.65rem; color: var(--text-muted); line-height: 1.4;">
            Reposition and orient the BIM model across the 3D ground basemap and parcel site datum.
          </div>

          <!-- Interactive Action Buttons -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem;">
            <button type="button" id="gis-btn-pick-model-loc" class="btn-cost-action rates" style="border-color: var(--color-info-border); color: var(--color-info); font-size: 0.65rem; padding: 0.4rem 0.5rem;" title="Click on 3D Ground Basemap or 2D Mini-Map to Move Model">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
              <span id="gis-text-pick-model">Click Map to Move</span>
            </button>
            <button type="button" id="gis-btn-snap-model-ground" class="btn-cost-action boq" style="font-size: 0.65rem; padding: 0.4rem 0.5rem;" title="Snap Model Base to Ground Basemap Elevation Offset">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>
              <span>Snap Ground</span>
            </button>
          </div>

          <!-- Easting / Northing Sliders & Inputs -->
          <div style="display: flex; flex-direction: column; gap: 0.45rem; margin-top: 0.2rem;">
            <!-- Easting X -->
            <div style="display: flex; flex-direction: column; gap: 0.2rem;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="gis-field-label" style="margin-bottom: 0;">Easting Offset (ΔX East):</span>
                <div style="display: flex; gap: 0.3rem; align-items: center;">
                  <button type="button" id="gis-btn-nudge-x-neg" class="gis-btn-nudge" title="Move 10m West">−10</button>
                  <input type="number" id="gis-model-input-x" aria-label="Easting Offset (ΔX East)" title="Easting Offset (ΔX East)" class="gis-input mono" step="0.5" value="0.0" style="width: 62px; padding: 0.2rem 0.35rem; text-align: right;" />
                  <button type="button" id="gis-btn-nudge-x-pos" class="gis-btn-nudge" title="Move 10m East">+10</button>
                </div>
              </div>
              <input type="range" id="gis-model-slider-x" aria-label="Easting Offset Slider" title="Easting Offset Slider" min="-500" max="500" step="1" value="0" style="width: 100%; accent-color: var(--color-info);" />
            </div>

            <!-- Northing Z -->
            <div style="display: flex; flex-direction: column; gap: 0.2rem;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="gis-field-label" style="margin-bottom: 0;">Northing Offset (ΔZ North):</span>
                <div style="display: flex; gap: 0.3rem; align-items: center;">
                  <button type="button" id="gis-btn-nudge-z-pos" class="gis-btn-nudge" title="Move 10m North">+10</button>
                  <input type="number" id="gis-model-input-z" aria-label="Northing Offset (ΔZ North)" title="Northing Offset (ΔZ North)" class="gis-input mono" step="0.5" value="0.0" style="width: 62px; padding: 0.2rem 0.35rem; text-align: right;" />
                  <button type="button" id="gis-btn-nudge-z-neg" class="gis-btn-nudge" title="Move 10m South">−10</button>
                </div>
              </div>
              <input type="range" id="gis-model-slider-z" aria-label="Northing Offset Slider" title="Northing Offset Slider" min="-500" max="500" step="1" value="0" style="width: 100%; accent-color: var(--color-info);" />
            </div>

            <!-- Elevation Y & Rotation Y -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem;">
              <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="gis-field-label" style="margin-bottom: 0;">Elevation (ΔY):</span>
                  <span id="gis-model-val-y" class="gis-telemetry-pill sky">0.00 m</span>
                </div>
                <input type="range" id="gis-model-slider-y" aria-label="Elevation (ΔY) Slider" title="Elevation (ΔY) Slider" min="-30" max="30" step="0.25" value="0" style="width: 100%; accent-color: var(--color-info);" />
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="gis-field-label" style="margin-bottom: 0;">Orientation (Yaw):</span>
                  <span id="gis-model-val-rot" class="gis-telemetry-pill sky">0.0°</span>
                </div>
                <input type="range" id="gis-model-slider-rot" aria-label="Orientation (Yaw) Slider" title="Orientation (Yaw) Slider" min="0" max="360" step="0.5" value="0" style="width: 100%; accent-color: var(--color-info);" />
              </div>
            </div>
          </div>

          <!-- Live Model Geographic Coordinates -->
          <div style="padding: 0.45rem 0.6rem; background: var(--color-info-subtle); border: 1px solid var(--color-info-border); border-radius: 6px; font-family: var(--font-mono); font-size: 0.62rem; display: flex; flex-direction: column; gap: 0.25rem;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Model GPS (WGS84):</span>
              <span id="gis-model-gps" style="color: var(--color-info); font-weight: 700;">35.676200°, 139.650300°</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Model Elevation AMSL:</span>
              <span id="gis-model-elev-amsl" style="color: var(--text-primary); font-weight: 600;">40.00 m</span>
            </div>
          </div>

          <!-- Quick Station Snap & Reset -->
          <div style="display: flex; gap: 0.4rem; align-items: center; margin-top: 0.2rem;">
            <select id="gis-select-snap-gcp" class="gis-select" style="flex: 1;" title="Select a survey benchmark to align the model origin">
              <option value="BM-01">Snap to BM-01 (Site Benchmark)</option>
              <option value="GCP-01">Snap to GCP-01 (NE Control)</option>
              <option value="GCP-02">Snap to GCP-02 (SW Control)</option>
            </select>
            <button type="button" id="gis-btn-snap-to-gcp" class="btn-secondary" style="padding: 0.35rem 0.55rem; font-size: 0.65rem; white-space: nowrap;" title="Move Model Origin to Selected Survey Station">Snap</button>
            <button type="button" id="gis-btn-reset-model-pos" class="btn-icon" style="width: 28px; height: 28px;" title="Reset Model Position to Origin (0,0,0)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            </button>
          </div>
        </div>

        <!-- Survey Ground Control Points (GCPs) & Site Benchmark Suite -->
        <div class="drawer-section-header" style="margin-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
          <span>Survey GCPs & Benchmarks</span>
          <span id="gis-gcp-count-badge" class="gis-telemetry-pill">3 Points</span>
        </div>

        <div class="drawer-section-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label style="font-size: 0.68rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 0.35rem; cursor: pointer;">
              <input type="checkbox" id="gis-toggle-gcps" aria-label="Show 3D Survey Prisms & Laser Poles" title="Show 3D Survey Prisms & Laser Poles" style="accent-color: var(--color-cyan);" />
              <span>Show 3D Survey Prisms & Laser Poles</span>
            </label>
            <button type="button" id="gis-btn-add-gcp" class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.62rem; display: flex; align-items: center; gap: 0.25rem;" title="Add Survey Control Point at Site Origin">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Add GCP</span>
            </button>
          </div>

          <!-- GCP Points List Container -->
          <div id="gis-survey-points-list" style="display: flex; flex-direction: column; gap: 0.35rem; max-height: 160px; overflow-y: auto; padding-right: 3px;">
            <!-- Injected dynamically by refreshGisUI() -->
          </div>

          <!-- Geodesic Measurement Output (Between GCPs) -->
          <div id="gis-geodesic-measurement" class="hidden" style="padding: 0.45rem 0.6rem; background: var(--color-cyan-subtle); border: 1px solid var(--color-cyan-border); border-radius: 6px; font-family: var(--font-mono); font-size: 0.62rem; color: var(--text-secondary);">
            <div style="font-weight: 700; color: var(--color-cyan); margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.3rem;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
              <span>Geodesic Baseline Vector:</span>
            </div>
            <div id="gis-measurement-details">Distance: -- m | Azimuth: --° | dZ: -- m</div>
          </div>

          <!-- Survey Export Actions -->
          <div style="display: grid; grid-template-columns: 1fr; gap: 0.45rem; margin-top: 0.25rem;">
            <button type="button" id="gis-btn-export-gcp-csv" class="btn-cost-action rates" style="font-size: 0.65rem; justify-content: center; padding: 0.4rem 0.6rem;" title="Export Total Station / GNSS Survey CSV File">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <span>Export Total Station CSV (GCPs)</span>
            </button>
          </div>
        </div>

        <!-- ============ SOLAR STUDY ============ -->
        <div class="drawer-section-header" style="margin-top: 0.75rem;">
          <span>Solar Study &amp; Shadow Simulation</span>
          <span id="geo-sun-badge" class="gis-telemetry-pill">--</span>
        </div>
        <div class="drawer-section-card geo-suite-card">
          <div class="geo-row">
            <label for="geo-sun-date" class="gis-field-label">Date</label>
            <input type="date" id="geo-sun-date" class="gis-input" />
          </div>
          <div class="geo-row">
            <label for="geo-sun-hour" class="gis-field-label">Time of Day <span id="geo-sun-hour-val" class="geo-val">12:00</span></label>
            <input type="range" id="geo-sun-hour" min="0" max="24" step="0.25" value="12" />
          </div>
          <div class="geo-presets">
            <button type="button" class="gis-btn-radius-preset geo-sun-preset" data-date="03-20">Equinox Mar</button>
            <button type="button" class="gis-btn-radius-preset geo-sun-preset" data-date="06-21">Summer Sol.</button>
            <button type="button" class="gis-btn-radius-preset geo-sun-preset" data-date="09-22">Equinox Sep</button>
            <button type="button" class="gis-btn-radius-preset geo-sun-preset" data-date="12-21">Winter Sol.</button>
          </div>
          <div id="geo-sun-readout" class="geo-readout">Azimuth -- · Elevation -- · Daylight --</div>
          <label class="geo-check"><input type="checkbox" id="geo-sun-path-toggle" aria-label="Show 3D sun-path arc" title="Show 3D sun-path arc" /> Show 3D sun-path arc</label>
          <div class="geo-grid-2">
            <button type="button" id="geo-sun-apply" class="btn-cost-action rates">Apply Sun</button>
            <button type="button" id="geo-sun-play" class="btn-cost-action boq">▶ Play Day Cycle</button>
          </div>
        </div>

        <!-- ============ SECTION BOX ============ -->
        <div class="drawer-section-header" style="margin-top: 0.75rem;">
          <span>3D Section Box</span>
          <span id="geo-box-badge" class="gis-telemetry-pill">Off</span>
        </div>
        <div class="drawer-section-card geo-suite-card">
          <label class="geo-check"><input type="checkbox" id="geo-box-toggle" aria-label="Enable section box clipping" title="Enable section box clipping" /> Enable section box clipping</label>
          <div id="geo-box-sliders" class="geo-box-sliders">
            <div class="geo-box-axis"><span class="geo-axis x">X</span><input type="range" data-axis="x" data-side="min" aria-label="Section Box Min X" title="Section Box Min X" min="0" max="1" step="0.005" value="0" /><input type="range" data-axis="x" data-side="max" aria-label="Section Box Max X" title="Section Box Max X" min="0" max="1" step="0.005" value="1" /></div>
            <div class="geo-box-axis"><span class="geo-axis y">Y</span><input type="range" data-axis="y" data-side="min" aria-label="Section Box Min Y" title="Section Box Min Y" min="0" max="1" step="0.005" value="0" /><input type="range" data-axis="y" data-side="max" aria-label="Section Box Max Y" title="Section Box Max Y" min="0" max="1" step="0.005" value="1" /></div>
            <div class="geo-box-axis"><span class="geo-axis z">Z</span><input type="range" data-axis="z" data-side="min" aria-label="Section Box Min Z" title="Section Box Min Z" min="0" max="1" step="0.005" value="0" /><input type="range" data-axis="z" data-side="max" aria-label="Section Box Max Z" title="Section Box Max Z" min="0" max="1" step="0.005" value="1" /></div>
          </div>
          <div id="geo-box-readout" class="geo-readout">Box: --</div>
          <div class="geo-grid-2">
            <button type="button" id="geo-box-fit" class="btn-cost-action rates">Fit to Model</button>
            <button type="button" id="geo-box-reset" class="btn-cost-action boq">Reset Box</button>
          </div>
        </div>

        <!-- ============ TERRAIN ============ -->
        <div class="drawer-section-header" style="margin-top: 0.75rem;">
          <span>3D Terrain (DEM) &amp; Earthworks</span>
          <span id="geo-terrain-badge" class="gis-telemetry-pill">None</span>
        </div>
        <div class="drawer-section-card geo-suite-card">
          <div class="geo-grid-2">
            <div class="geo-row">
              <label for="geo-terrain-exag" class="gis-field-label">Vertical Exaggeration <span id="geo-terrain-exag-val" class="geo-val">1.0×</span></label>
              <input type="range" id="geo-terrain-exag" min="0.5" max="5" step="0.1" value="1" />
            </div>
            <div class="geo-row">
              <label for="geo-terrain-contour" class="gis-field-label">Contour Interval (m)</label>
              <input type="number" id="geo-terrain-contour" class="gis-input" min="0.5" step="0.5" value="2" />
            </div>
          </div>
          <div class="geo-row">
            <label for="geo-terrain-pad" class="gis-field-label">Building Pad Elevation (m, relative)</label>
            <input type="number" id="geo-terrain-pad" class="gis-input" step="0.1" value="0" />
          </div>
          <div id="geo-terrain-readout" class="geo-readout">Generate terrain to compute cut / fill.</div>
          <div class="geo-grid-2">
            <button type="button" id="geo-terrain-build" class="btn-cost-action rates">Build Terrain</button>
            <button type="button" id="geo-terrain-remove" class="btn-cost-action boq">Remove</button>
          </div>
          <button type="button" id="geo-terrain-cutfill" class="btn-cost-action boq geo-full">Compute Footprint Cut / Fill</button>
        </div>

        <!-- ============ IFC GEOREF ============ -->
        <div class="drawer-section-header" style="margin-top: 0.75rem;">
          <span>IFC4 Georeferencing Export</span>
        </div>
        <div class="drawer-section-card geo-suite-card">
          <div id="geo-ifc-readout" class="geo-readout">IfcMapConversion · IfcProjectedCRS (buildingSMART)</div>
          <div class="geo-row">
            <label for="geo-ifc-file" class="gis-field-label">Inject into existing IFC (optional)</label>
            <input type="file" id="geo-ifc-file" accept=".ifc" class="gis-input" style="padding: 0.25rem 0.4rem; font-size: 0.62rem;" />
          </div>
          <div class="geo-grid-2">
            <button type="button" id="geo-ifc-export" class="btn-cost-action rates">Export .ifc</button>
            <button type="button" id="geo-ifc-json" class="btn-cost-action boq">Export JSON</button>
          </div>
        </div>

        <!-- ============ SURVEY DISCREPANCY ============ -->
        <div class="drawer-section-header" style="margin-top: 0.75rem;">
          <span>Field Survey Discrepancy</span>
          <span id="geo-disc-badge" class="gis-telemetry-pill">0 pts</span>
        </div>
        <div class="drawer-section-card geo-suite-card">
          <div class="geo-grid-2">
            <div class="geo-row">
              <label for="geo-tol-pass" class="gis-field-label">Pass ≤ (mm)</label>
              <input type="number" id="geo-tol-pass" class="gis-input" min="1" value="15" />
            </div>
            <div class="geo-row">
              <label for="geo-tol-warn" class="gis-field-label">Warn ≤ (mm)</label>
              <input type="number" id="geo-tol-warn" class="gis-input" min="1" value="30" />
            </div>
          </div>
          <div class="geo-row">
            <label for="geo-disc-file" class="gis-field-label">Total Station CSV (id,x,y,z or id,E,N,H)</label>
            <input type="file" id="geo-disc-file" accept=".csv,.txt" class="gis-input" style="padding: 0.25rem 0.4rem; font-size: 0.62rem;" />
          </div>
          <div id="geo-disc-summary" class="geo-readout">Compared against Survey GCPs.</div>
          <div id="geo-disc-list" class="geo-disc-list"></div>
          <div class="geo-grid-2">
            <button type="button" id="geo-disc-demo" class="btn-cost-action rates">Demo Field Data</button>
            <button type="button" id="geo-disc-export" class="btn-cost-action boq">Export Report</button>
          </div>
          <button type="button" id="geo-disc-clear" class="btn-cost-action boq geo-full">Clear Heatmap</button>
        </div>

        <!-- ============ WALKTHROUGH ============ -->
        <div class="drawer-section-header" style="margin-top: 0.75rem;">
          <span>First-Person Walkthrough</span>
          <span id="geo-walk-badge" class="gis-telemetry-pill">Idle</span>
        </div>
        <div class="drawer-section-card geo-suite-card">
          <div class="geo-grid-2">
            <div class="geo-row">
              <label for="geo-walk-speed" class="gis-field-label">Speed <span id="geo-walk-speed-val" class="geo-val">3.2 m/s</span></label>
              <input type="range" id="geo-walk-speed" min="0.5" max="10" step="0.1" value="3.2" />
            </div>
            <div class="geo-row">
              <label for="geo-walk-eye" class="gis-field-label">Eye Height (m)</label>
              <input type="number" id="geo-walk-eye" class="gis-input" min="0.5" max="3" step="0.05" value="1.65" />
            </div>
          </div>
          <label class="geo-check"><input type="checkbox" id="geo-walk-collision" aria-label="Floor follow and wall collision" title="Floor follow and wall collision" checked /> Floor follow &amp; wall collision</label>
          <div class="geo-readout">WASD move · Shift run · Q/E fly · click to mouse-look · Esc exit</div>
          <button type="button" id="geo-walk-toggle" class="btn-cost-action rates geo-full">Start Walkthrough</button>
        </div>

        <!-- ============ OFFLINE CACHE ============ -->
        <div class="drawer-section-header" style="margin-top: 0.75rem;">
          <span>Offline Basemap Cache</span>
          <span id="geo-cache-badge" class="gis-telemetry-pill">--</span>
        </div>
        <div class="drawer-section-card geo-suite-card">
          <label class="geo-check"><input type="checkbox" id="geo-cache-toggle" aria-label="Cache tiles in IndexedDB (offline jobsite mode)" title="Cache tiles in IndexedDB" checked /> Cache tiles in IndexedDB (offline jobsite mode)</label>
          <div id="geo-cache-readout" class="geo-readout">--</div>
          <div class="geo-grid-2">
            <button type="button" id="geo-cache-refresh" class="btn-cost-action rates">Refresh Stats</button>
            <button type="button" id="geo-cache-clear" class="btn-cost-action boq">Clear Cache</button>
          </div>
        </div>

        <!-- Municipal Cadastre & Underground Utilities -->
        <div class="drawer-section-header" style="margin-top: 0.75rem;">
          <span>Cadastre & GeoJSON Utilities</span>
        </div>

        <div class="drawer-section-card">
          <div style="font-size: 0.65rem; color: var(--text-muted); line-height: 1.4;">
            Overlay municipal cadastral property boundaries, zoning easements, and 3D underground utility conduits (water, stormwater, power).
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem; margin-top: 0.25rem;">
            <button type="button" id="gis-btn-demo-cadastre" class="btn-cost-action rates" style="padding: 0.4rem 0.5rem;" title="Generate Demo Cadastral Parcels & Utilities">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              <span>Demo Cadastre</span>
            </button>
            <button type="button" id="gis-btn-clear-cadastre" class="btn-cost-action boq" style="padding: 0.4rem 0.5rem;" title="Clear GIS Layers">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span>Clear Layers</span>
            </button>
          </div>

          <!-- File Upload for Custom GeoJSON -->
          <div style="display: flex; flex-direction: column; gap: 0.25rem; margin-top: 0.3rem;">
            <label for="gis-file-geojson" class="gis-field-label">Import Municipal GeoJSON (.geojson / .json):</label>
            <input type="file" id="gis-file-geojson" accept=".geojson,.json" class="gis-input" style="padding: 0.25rem 0.4rem; font-size: 0.62rem;" />
          </div>
        </div>

        <!-- Live GPS & Telemetry Card -->
        <div class="drawer-section-header" style="margin-top: 0.75rem;">
          <span>Live Spatial Telemetry</span>
        </div>

        <div class="drawer-section-card" style="font-family: var(--font-mono); font-size: 0.65rem; display: flex; flex-direction: column; gap: 0.35rem;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">Site Origin:</span>
            <span id="gis-telemetry-origin" style="color: var(--text-primary); font-weight: 600;">0.0, 0.0, 0.0</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">Cursor (Local 3D):</span>
            <span id="gis-telemetry-local" style="color: var(--text-primary); font-weight: 600;">X: 0.00m, Z: 0.00m</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">Cursor (GPS WGS84):</span>
            <span id="gis-telemetry-gps" style="color: var(--color-cyan); font-weight: 700;">35.676200°, 139.650300°</span>
          </div>
          <button type="button" id="gis-btn-export-geojson" class="btn-cost-action report" style="width: 100%; margin-top: 0.4rem; justify-content: center; padding: 0.45rem 0.65rem;" title="Export Site Coordinates & Georeference as GeoJSON">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Export Site GeoJSON FeatureCollection</span>
          </button>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem; margin-top: 0.25rem;">
            <button type="button" id="gis-btn-export-world-file" class="btn-cost-action boq" style="font-size: 0.62rem; justify-content: center; padding: 0.35rem 0.5rem;" title="Export ESRI World File (.wld) for GIS Raster Alignment">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>Export World File (.wld)</span>
            </button>
            <button type="button" id="gis-btn-export-prj" class="btn-cost-action boq" style="font-size: 0.62rem; justify-content: center; padding: 0.35rem 0.5rem;" title="Export Projection WKT (.prj) File">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 12 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              <span>Export Projection (.prj)</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 9. Engineering Studio Drawer (Vector 2D/DXF · Reality Capture · IFC Split · Civil 4.3) -->
    <div id="engineering-panel" class="enterprise-drawer hidden">
      <div class="drawer-header">
        <div class="drawer-title-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>
          <h3>Engineering Studio</h3>
        </div>
        <div class="drawer-header-actions">
          <span class="drawer-status-tag">ThatOpen 3.6</span>
          <button class="btn-icon drawer-center-toggle-btn" data-target="engineering-panel" aria-label="Toggle Centralized Modal / Right Dock" title="Toggle Centralized Modal / Right Dock"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="3"/></svg></button>
          <button class="btn-icon drawer-close-btn" data-target="engineering-panel" aria-label="Close Engineering Studio Drawer" title="Close Drawer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <div class="drawer-body thin-scrollbar" style="display: flex; flex-direction: column; gap: 0.65rem;">
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.35rem;">
          <button type="button" class="settings-cat-btn eng-tab-btn active" data-eng-tab="dxf">2D / DXF</button>
          <button type="button" class="settings-cat-btn eng-tab-btn" data-eng-tab="capture">Captures</button>
          <button type="button" class="settings-cat-btn eng-tab-btn" data-eng-tab="split">IFC Split</button>
          <button type="button" class="settings-cat-btn eng-tab-btn" data-eng-tab="civil">Civil 4.3</button>
        </div>

        <!-- TAB 1: Vector 2D Projection & DXF Export -->
        <div class="drawer-section-card eng-tab-section" data-eng-section="dxf" style="display: flex; flex-direction: column; gap: 0.55rem;">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-primary);">Vector Edge Projection &amp; CAD DXF</div>
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
            <label for="eng-proj-view" style="font-size: 0.68rem; color: var(--text-muted);">View Plane</label>
            <select id="eng-proj-view" class="custom-select" style="flex: 1;">
              <option value="top">Top (Plan View)</option>
              <option value="front">Front Elevation</option>
              <option value="back">Back Elevation</option>
              <option value="left">Left Elevation</option>
              <option value="right">Right Elevation</option>
            </select>
          </div>
          <label style="display: flex; align-items: center; gap: 0.45rem; font-size: 0.68rem; color: var(--text-muted); cursor: pointer;">
            <input type="checkbox" id="eng-proj-hidden" style="accent-color: #38bdf8;" />
            <span>Show Hidden Back-Face Edges</span>
          </label>
          <div class="drawer-actions-bar">
            <button type="button" id="btn-eng-project" class="btn-md btn-accent flex-1">Project 2D Edges</button>
            <button type="button" id="btn-eng-export-dxf" class="btn-md btn-outline">Export DXF</button>
          </div>
          <div class="drawer-actions-bar">
            <button type="button" id="btn-eng-dim-tool" class="btn-md btn-outline flex-1">Place CAD Linear Dimension</button>
            <button type="button" id="btn-eng-clear-proj" class="btn-md btn-outline">Clear</button>
          </div>
          <div id="eng-proj-status" style="font-size: 0.64rem; color: var(--text-muted); font-family: var(--font-mono);">No active projection</div>
        </div>

        <!-- TAB 2: Reality Capture (Point Clouds + Gaussian Splats) -->
        <div class="drawer-section-card eng-tab-section hidden" data-eng-section="capture" style="display: none; flex-direction: column; gap: 0.55rem;">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-primary);">Reality Capture (Deferred BIM Occlusion)</div>
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <label for="eng-pc-files" style="font-size: 0.66rem; color: var(--text-muted);">Point Cloud (.las OR Potree metadata.json + hierarchy.bin + octree.bin):</label>
            <input type="file" id="eng-pc-files" multiple accept=".las,.json,.bin" class="gis-input" style="padding: 0.25rem; font-size: 0.64rem;" />
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <label for="eng-splat-files" style="font-size: 0.66rem; color: var(--text-muted);">3D Gaussian Splat (.ply / .compressed.ply):</label>
            <input type="file" id="eng-splat-files" accept=".ply" class="gis-input" style="padding: 0.25rem; font-size: 0.64rem;" />
          </div>
          <label style="display: flex; align-items: center; gap: 0.45rem; font-size: 0.68rem; color: var(--text-muted); cursor: pointer;">
            <input type="checkbox" id="eng-pc-edl" checked style="accent-color: #38bdf8;" />
            <span>Eye-Dome Lighting (EDL Shading)</span>
          </label>
          <div class="control-row">
            <div style="display: flex; justify-content: space-between; font-size: 0.66rem; color: var(--text-muted);">
              <span>Point Budget</span>
              <span class="value-badge" id="val-eng-pc-budget">2.0M</span>
            </div>
            <input type="range" id="eng-pc-budget" class="custom-slider" min="250000" max="6000000" step="250000" value="2000000" style="width: 100%;" />
          </div>
          <div class="control-row">
            <div style="display: flex; justify-content: space-between; font-size: 0.66rem; color: var(--text-muted);">
              <span>Gaussian Splat Scale</span>
              <span class="value-badge" id="val-eng-splat-scale">1.00x</span>
            </div>
            <input type="range" id="eng-splat-scale" class="custom-slider" min="0.1" max="3.0" step="0.05" value="1.0" style="width: 100%;" />
          </div>
          <button type="button" id="btn-eng-clear-capture" class="btn-md btn-outline">Clear Captures</button>
          <div id="eng-capture-status" style="font-size: 0.64rem; color: var(--text-muted); font-family: var(--font-mono);">0 clouds · 0 splats active</div>
        </div>

        <!-- TAB 3: Client-Side IFC Splitter & Extractor -->
        <div class="drawer-section-card eng-tab-section hidden" data-eng-section="split" style="display: none; flex-direction: column; gap: 0.55rem;">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-primary);">Client-Side IFC Splitter (FRAGS.IfcSplitter)</div>
          <input type="file" id="eng-split-file" accept=".ifc" class="gis-input" style="padding: 0.25rem; font-size: 0.64rem;" />
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
            <label for="eng-split-parts" style="font-size: 0.68rem; color: var(--text-muted);">Split Partitions</label>
            <input type="number" id="eng-split-parts" min="2" max="16" value="3" class="gis-input mono" style="width: 68px; text-align: right; padding: 0.2rem 0.4rem;" />
          </div>
          <div class="drawer-actions-bar">
            <button type="button" id="btn-eng-split-ifc" class="btn-md btn-accent flex-1">Split IFC</button>
            <button type="button" id="btn-eng-extract-selected" class="btn-md btn-outline">Extract Selection</button>
          </div>
          <button type="button" id="btn-eng-download-splits" class="btn-md btn-outline">Download Output IFCs</button>
          <div id="eng-split-status" style="font-size: 0.64rem; color: var(--text-muted); font-family: var(--font-mono);">Choose a local .ifc file to split or extract</div>
        </div>

        <!-- TAB 4: IFC 4.3 Civil Alignments -->
        <div class="drawer-section-card eng-tab-section hidden" data-eng-section="civil" style="display: none; flex-direction: column; gap: 0.55rem;">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-primary);">IFC 4.3 Infrastructure &amp; Alignments</div>
          <div style="font-size: 0.66rem; color: var(--text-muted); line-height: 1.4;">
            Detects <code style="font-size:0.62rem;">IfcAlignment</code> horizontal/vertical geometry on loaded infrastructure models and enables cross-section inspection.
          </div>
          <div class="drawer-actions-bar">
            <button type="button" id="btn-eng-scan-civil" class="btn-md btn-accent flex-1">Scan Alignments</button>
            <button type="button" id="btn-eng-civil-cross-section" class="btn-md btn-outline">Cross Section</button>
          </div>
          <div id="eng-civil-status" style="font-size: 0.64rem; color: var(--text-muted); font-family: var(--font-mono);">Not scanned yet</div>
          <div id="eng-civil-profile-wrap" class="civil-profile-wrap hidden">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
              <span style="font-size:0.64rem; font-weight:700; color:var(--text-primary);">Vertical Profile (Click Station to Fly)</span>
              <span id="eng-civil-chainage-readout" style="font-size:0.6rem; font-family:var(--font-mono); color:var(--color-info);">—</span>
            </div>
            <div id="eng-civil-profile-container"></div>
          </div>
        </div>
      </div>
    </div>`,e=!0,n):null}export{t as mountEnterpriseDrawers};