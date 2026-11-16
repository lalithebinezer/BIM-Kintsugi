import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";

export interface CollabUser {
  id: string;
  name: string;
  role: string;
  color: string;
  isHost?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
  currentSelection?: string;
  cursorPosition: [number, number, number];
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  lastActive: string;
}

export interface CollabChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  userRole: string;
  text: string;
  timestamp: string;
  coordinatePin?: [number, number, number];
}

export class CollaborationManager {
  private static instance: CollaborationManager;
  private static readonly STORAGE_KEY = "bim_live_peers_enabled";
  private engine: BimEngine;
  private activeUsers: CollabUser[] = [];
  private currentUser: CollabUser;
  private chatMessages: CollabChatMessage[] = [];
  private isLivePeersEnabled: boolean = true;
  private isFollowHostActive: boolean = false;
  private broadcastChannel: BroadcastChannel | null = null;
  private pointerBound: boolean = false;
  private avatarGroup: THREE.Group;
  private beaconGroup: THREE.Group;

  private userColors = ["#D4FF3F", "#38BDF8", "#F43F5E", "#A855F7", "#F59E0B", "#10B981"];

  private constructor() {
    this.engine = BimEngine.getInstance();
    this.avatarGroup = new THREE.Group();
    this.avatarGroup.name = "CollabAvatarGroup";
    this.beaconGroup = new THREE.Group();
    this.beaconGroup.name = "CollabBeaconGroup";

    if (this.engine.world?.scene?.three) {
      this.engine.world.scene.three.add(this.avatarGroup);
      this.engine.world.scene.three.add(this.beaconGroup);
    }

    const randomColor = this.userColors[Math.floor(Math.random() * this.userColors.length)];
    this.currentUser = {
      id: `user_${Math.random().toString(36).substring(2, 8)}`,
      name: "You (Reviewer)",
      role: "Lead Coordinator",
      color: randomColor,
      isHost: false,
      isSpeaking: false,
      isMuted: true,
      currentSelection: "IFCCOLUMN_204",
      cursorPosition: [0, 0, 0],
      cameraPosition: [15, 20, 25],
      cameraTarget: [0, 0, 0],
      lastActive: "Just now",
    };

    this.isLivePeersEnabled = this.loadLivePeersPreference();
    this.seedDefaultCollabPeers();
    this.seedDefaultChat();
    this.bindPointerTracking();

    if (this.isLivePeersEnabled) {
      this.initBroadcastChannel();
      this.renderPeerAvatars();
    } else {
      this.avatarGroup.visible = false;
      this.beaconGroup.visible = false;
      this.clearPeerAvatars();
    }
  }

  private loadLivePeersPreference(): boolean {
    try {
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem(CollaborationManager.STORAGE_KEY) !== "false";
      }
    } catch {}
    return true;
  }

  public static getInstance(): CollaborationManager {
    if (!CollaborationManager.instance) {
      CollaborationManager.instance = new CollaborationManager();
    }
    return CollaborationManager.instance;
  }

  public getCurrentUser(): CollabUser {
    return this.currentUser;
  }

  public isLivePeersOn(): boolean {
    return this.isLivePeersEnabled;
  }

  public setLivePeersEnabled(enabled: boolean): boolean {
    this.isLivePeersEnabled = enabled;
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(CollaborationManager.STORAGE_KEY, enabled ? "true" : "false");
      }
    } catch {}

    if (enabled) {
      this.avatarGroup.visible = true;
      this.beaconGroup.visible = true;
      this.initBroadcastChannel();
      this.renderPeerAvatars();
    } else {
      this.isFollowHostActive = false;
      this.currentUser.isMuted = true;
      this.currentUser.isSpeaking = false;
      this.closeBroadcastChannel();
      this.avatarGroup.visible = false;
      this.beaconGroup.visible = false;
      this.clearPeerAvatars();
      this.clearBeacons();
    }

    this.updateCollabUI();
    return this.isLivePeersEnabled;
  }

  public toggleLivePeers(enabled?: boolean): boolean {
    const next = enabled !== undefined ? enabled : !this.isLivePeersEnabled;
    return this.setLivePeersEnabled(next);
  }

  public getActiveUsers(): CollabUser[] {
    if (!this.isLivePeersEnabled) {
      return [this.currentUser];
    }
    return [this.currentUser, ...this.activeUsers];
  }

  public getChatMessages(): CollabChatMessage[] {
    return this.chatMessages;
  }

  public toggleFollowHost(active?: boolean): boolean {
    if (!this.isLivePeersEnabled) {
      this.isFollowHostActive = false;
      this.updateCollabUI();
      return false;
    }
    this.isFollowHostActive = active !== undefined ? active : !this.isFollowHostActive;
    if (this.isFollowHostActive) {
      const host = this.activeUsers.find((u) => u.isHost) || this.activeUsers[0];
      if (host) {
        this.syncCameraToUser(host);
      }
    }
    this.updateCollabUI();
    return this.isFollowHostActive;
  }

  public isFollowingHost(): boolean {
    return this.isFollowHostActive;
  }

  public toggleMic(): boolean {
    if (!this.isLivePeersEnabled) {
      this.currentUser.isMuted = true;
      this.currentUser.isSpeaking = false;
      this.updateCollabUI();
      return false;
    }
    this.currentUser.isMuted = !this.currentUser.isMuted;
    this.currentUser.isSpeaking = !this.currentUser.isMuted;
    this.broadcastMyPresence();
    this.updateCollabUI();
    return !this.currentUser.isMuted;
  }

  public setTab(_tab?: "peers" | "chat") {
    this.updateCollabUI();
  }

  public pingCurrentLocation(): [number, number, number] {
    let pinPos: [number, number, number] = [0, 1.5, 0];
    const cam = this.engine.world?.camera;
    if (cam && cam.three) {
      const forward = new THREE.Vector3(0, 0, -8).applyQuaternion(cam.three.quaternion);
      pinPos = [
        cam.three.position.x + forward.x,
        Math.max(0.5, cam.three.position.y + forward.y),
        cam.three.position.z + forward.z,
      ];
    }

    if (!this.isLivePeersEnabled) {
      this.updateCollabUI();
      return pinPos;
    }

    this.spawnBeacon(pinPos, this.currentUser.color, `${this.currentUser.name} Pinged Location`);
    
    // Broadcast ping
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: "ping_location",
        data: {
          pos: pinPos,
          user: this.currentUser,
        },
      });
    }

    this.sendChatMessage(`📍 Pinged 3D Coordinate [${pinPos[0].toFixed(1)}, ${pinPos[1].toFixed(1)}, ${pinPos[2].toFixed(1)}]`, pinPos);
    return pinPos;
  }

  public spawnBeacon(pos: [number, number, number], colorHex: string, _label?: string) {
    if (!this.isLivePeersEnabled || !this.engine.world?.scene?.three) return;

    const beaconMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex), transparent: true, opacity: 0.85 })
    );
    beaconMesh.position.set(pos[0], pos[1], pos[2]);

    const pulseRing = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.9, 24),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex), side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    pulseRing.rotation.x = Math.PI / 2;
    pulseRing.position.set(pos[0], pos[1] - 0.2, pos[2]);

    this.beaconGroup.add(beaconMesh);
    this.beaconGroup.add(pulseRing);

    // Fade out beacon after 8 seconds
    setTimeout(() => {
      this.beaconGroup.remove(beaconMesh);
      this.beaconGroup.remove(pulseRing);
      beaconMesh.geometry.dispose();
      (beaconMesh.material as THREE.Material).dispose();
      pulseRing.geometry.dispose();
      (pulseRing.material as THREE.Material).dispose();
    }, 8000);
  }

  public sendChatMessage(text: string, pin?: [number, number, number]): CollabChatMessage {
    const msg: CollabChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userColor: this.currentUser.color,
      userRole: this.currentUser.role,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      coordinatePin: pin,
    };

    this.chatMessages.push(msg);

    if (this.isLivePeersEnabled && this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: "chat_message",
        data: msg,
      });
    }

    this.updateCollabUI();
    return msg;
  }

  private closeBroadcastChannel() {
    if (!this.broadcastChannel) return;
    try {
      this.broadcastChannel.postMessage({
        type: "user_leave",
        data: { id: this.currentUser.id },
      });
      this.broadcastChannel.close();
    } catch {}
    this.broadcastChannel = null;
  }

  private initBroadcastChannel() {
    if (!this.isLivePeersEnabled || this.broadcastChannel) return;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        this.broadcastChannel = new BroadcastChannel("bim_kintsugi_collab_v2");
        this.broadcastChannel.onmessage = (event) => {
          if (!this.isLivePeersEnabled) return;
          const { type, data } = event.data;
          if (type === "user_presence" && data.id !== this.currentUser.id) {
            this.handlePeerPresence(data);
          } else if (type === "user_leave" && data?.id && data.id !== this.currentUser.id) {
            this.activeUsers = this.activeUsers.filter((u) => u.id !== data.id);
            this.renderPeerAvatars();
            this.updateCollabUI();
          } else if (type === "chat_message") {
            this.chatMessages.push(data);
            this.updateCollabUI();
          } else if (type === "ping_location") {
            this.spawnBeacon(data.pos, data.user.color, `${data.user.name} Pinged Location`);
          }
        };

        this.broadcastMyPresence();
      } catch (e) {}
    }
  }

  private seedDefaultCollabPeers() {
    this.activeUsers = [
      {
        id: "peer_mep",
        name: "Elena Rostova",
        role: "MEP Engineer",
        color: "#38BDF8",
        isHost: true,
        isSpeaking: true,
        isMuted: false,
        currentSelection: "IFCDUCTSEGMENT_4021",
        cursorPosition: [4.2, 3.8, -8.5],
        cameraPosition: [12, 14, 18],
        cameraTarget: [4, 3, -8],
        lastActive: "Active now",
      },
      {
        id: "peer_str",
        name: "David Chen",
        role: "Structural Lead",
        color: "#F43F5E",
        isSpeaking: false,
        isMuted: true,
        currentSelection: "IFCBEAM_1109",
        cursorPosition: [-6.8, 3.2, 12.1],
        cameraPosition: [-10, 15, 20],
        cameraTarget: [-6, 3, 12],
        lastActive: "Active now",
      },
      {
        id: "peer_pm",
        name: "Sarah Miller",
        role: "BIM Manager",
        color: "#A855F7",
        isSpeaking: false,
        isMuted: true,
        currentSelection: "IFCSLAB_002",
        cursorPosition: [1.5, 2.7, 5.0],
        cameraPosition: [8, 12, 14],
        cameraTarget: [1, 2, 5],
        lastActive: "Active now",
      },
    ];
  }

  private seedDefaultChat() {
    this.chatMessages = [
      {
        id: "msg_1",
        userId: "peer_mep",
        userName: "Elena Rostova",
        userColor: "#38BDF8",
        userRole: "MEP Engineer",
        text: "Checking clearance on Level 1 HVAC duct vs structural steel.",
        timestamp: "10:42 AM",
        coordinatePin: [4.2, 3.8, -8.5],
      },
      {
        id: "msg_2",
        userId: "peer_str",
        userName: "David Chen",
        userColor: "#F43F5E",
        userRole: "Structural Lead",
        text: "Agreed. Lowering beam flange by 50mm clears the clash.",
        timestamp: "10:43 AM",
        coordinatePin: [-6.8, 3.2, 12.1],
      },
    ];
  }

  private bindPointerTracking() {
    if (typeof window === "undefined" || this.pointerBound) return;
    this.pointerBound = true;

    window.addEventListener("pointermove", () => {
      if (!this.isLivePeersEnabled || Math.random() > 0.3) return;
      try {
        const cam = this.engine.world?.camera;
        if (cam && cam.three) {
          this.currentUser.cameraPosition = [
            cam.three.position.x,
            cam.three.position.y,
            cam.three.position.z,
          ];
        }
      } catch (e) {}
      this.broadcastMyPresence();
    });
  }

  private broadcastMyPresence() {
    if (this.isLivePeersEnabled && this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: "user_presence",
        data: this.currentUser,
      });
    }
  }

  private handlePeerPresence(peer: CollabUser) {
    const existingIdx = this.activeUsers.findIndex((u) => u.id === peer.id);
    if (existingIdx !== -1) {
      this.activeUsers[existingIdx] = peer;
    } else {
      this.activeUsers.push(peer);
    }
    this.renderPeerAvatars();
    this.updateCollabUI();

    if (this.isFollowHostActive && peer.isHost) {
      this.syncCameraToUser(peer);
    }
  }

  public syncCameraToUser(user: CollabUser) {
    try {
      const cam = this.engine.world?.camera;
      if (cam && (cam as any).controls?.setLookAt) {
        (cam as any).controls.setLookAt(
          user.cameraPosition[0],
          user.cameraPosition[1],
          user.cameraPosition[2],
          user.cameraTarget[0],
          user.cameraTarget[1],
          user.cameraTarget[2],
          true
        );
      }
    } catch (e) {}
  }

  public teleportToPin(pin: [number, number, number]) {
    try {
      const cam = this.engine.world?.camera;
      if (cam && (cam as any).controls?.setLookAt) {
        (cam as any).controls.setLookAt(
          pin[0] + 5,
          pin[1] + 4,
          pin[2] + 5,
          pin[0],
          pin[1],
          pin[2],
          true
        );
      }
    } catch (e) {}
  }

  private clearPeerAvatars() {
    while (this.avatarGroup.children.length > 0) {
      const child = this.avatarGroup.children[0] as THREE.Mesh;
      this.avatarGroup.remove(child);
      child.geometry?.dispose?.();
      (child.material as THREE.Material)?.dispose?.();
    }
  }

  private clearBeacons() {
    while (this.beaconGroup.children.length > 0) {
      const child = this.beaconGroup.children[0] as THREE.Mesh;
      this.beaconGroup.remove(child);
      child.geometry?.dispose?.();
      (child.material as THREE.Material)?.dispose?.();
    }
  }

  private renderPeerAvatars() {
    this.clearPeerAvatars();
    if (!this.isLivePeersEnabled) return;

    for (const user of this.activeUsers) {
      const p = user.cursorPosition;
      const colorHex = parseInt(user.color.replace("#", "0x"), 16);

      const avatarMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.45, 8),
        new THREE.MeshBasicMaterial({ color: colorHex, depthTest: false, transparent: true, opacity: 0.9 })
      );
      avatarMesh.rotation.x = Math.PI;
      avatarMesh.position.set(p[0], p[1] + 0.25, p[2]);
      avatarMesh.renderOrder = 9999;

      this.avatarGroup.add(avatarMesh);
    }
  }

  public updateCollabUI() {
    if (typeof document === "undefined") return;

    const listEl = document.getElementById("collab-users-list");
    const countBadge = document.getElementById("collab-user-count-badge");
    const followBtn = document.getElementById("btn-follow-host") as HTMLButtonElement | null;
    const pingBtn = document.getElementById("btn-collab-ping-loc") as HTMLButtonElement | null;
    const micBtn = document.getElementById("btn-collab-mic-toggle") as HTMLButtonElement | null;
    const inviteBtn = document.getElementById("btn-collab-copy-invite") as HTMLButtonElement | null;
    const chatInput = document.getElementById("collab-chat-input") as HTMLInputElement | null;
    const chatSendBtn = document.getElementById("btn-collab-chat-send") as HTMLButtonElement | null;
    const chatContainer = document.getElementById("collab-chat-messages");
    const liveToggle = document.getElementById("toggle-live-peers") as HTMLInputElement | null;
    const settingsToggle = document.getElementById("settings-toggle-live-peers") as HTMLInputElement | null;
    const statusTextEl = document.getElementById("collab-live-status-text");
    const statusDotEl = document.getElementById("collab-live-status-dot");
    const dockBtn = document.getElementById("btn-dock-collab");
    const headerBtn = document.getElementById("btn-header-collab");

    const enabled = this.isLivePeersEnabled;
    if (liveToggle) liveToggle.checked = enabled;
    if (settingsToggle) settingsToggle.checked = enabled;
    if (statusTextEl) {
      statusTextEl.textContent = enabled
        ? "Live Peers: ON · Syncing Avatars"
        : "Live Peers: OFF · Avatars Hidden";
    }
    if (statusDotEl) {
      statusDotEl.classList.toggle("is-online", enabled);
      statusDotEl.classList.toggle("is-offline", !enabled);
    }
    dockBtn?.classList.toggle("peers-off", !enabled);
    headerBtn?.classList.toggle("peers-off", !enabled);

    const allUsers = this.getActiveUsers();
    if (countBadge) {
      countBadge.innerText = enabled ? `${allUsers.length} Online` : "OFF";
      countBadge.classList.toggle("tag-offline", !enabled);
    }

    if (followBtn) {
      followBtn.disabled = !enabled;
      followBtn.classList.toggle("active", enabled && this.isFollowHostActive);
      followBtn.innerText = enabled && this.isFollowHostActive ? "Following Presenter" : "Follow Presenter";
    }

    if (pingBtn) pingBtn.disabled = !enabled;
    if (inviteBtn) inviteBtn.disabled = !enabled;
    if (chatInput) {
      chatInput.disabled = !enabled;
      chatInput.placeholder = enabled ? "Type a message to peers..." : "Turn Live Peers ON to chat with peers...";
    }
    if (chatSendBtn) chatSendBtn.disabled = !enabled;

    if (micBtn) {
      micBtn.disabled = !enabled;
      micBtn.classList.toggle("active", enabled && !this.currentUser.isMuted);
      micBtn.innerHTML = !enabled || this.currentUser.isMuted
        ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> <span>Unmute</span>`
        : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg> <span>Mute</span>`;
    }

    if (listEl) {
      listEl.innerHTML = "";
      if (!enabled) {
        const offlineNotice = document.createElement("div");
        offlineNotice.className = "collab-offline-state";
        offlineNotice.innerHTML = `
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">Live Workstation Peers is OFF</div>
          <div style="font-size: 0.64rem; color: var(--text-muted); margin-bottom: 0.55rem; line-height: 1.4;">Remote peer avatars, 3D location beacons, and BroadcastChannel presence updates are paused.</div>
          <button type="button" id="btn-collab-turn-on" class="btn-xs btn-accent">Turn Live Peers ON</button>
        `;
        offlineNotice.querySelector("#btn-collab-turn-on")?.addEventListener("click", () => {
          this.setLivePeersEnabled(true);
        });
        listEl.appendChild(offlineNotice);
      }

      allUsers.forEach((u) => {
        const item = document.createElement("div");
        item.className = `collab-user-item ${u.isHost ? "is-host" : ""}`;
        
        const speakingWave = u.isSpeaking
          ? `<span class="audio-wave-anim" title="Speaking"><span class="bar"></span><span class="bar"></span><span class="bar"></span></span>`
          : "";

        const inspectedBadge = u.currentSelection
          ? `<span class="user-selection-badge" title="Currently Inspecting">👁️ ${u.currentSelection}</span>`
          : "";

        item.innerHTML = `
          <div class="user-avatar-indicator" style="background-color: ${u.color};">
            ${u.name.substring(0, 1)}
            <span class="user-online-dot ${u.isSpeaking ? 'speaking' : ''}"></span>
          </div>
          <div class="user-meta">
            <div class="user-name-row">
              <span class="user-name">${u.name} ${u.isHost ? "👑" : ""}</span>
              ${speakingWave}
            </div>
            <div class="user-sub-row">
              <span class="user-role">${u.role}</span>
              ${inspectedBadge}
            </div>
          </div>
          <div class="user-actions">
            <button class="btn-xs btn-outline jump-to-user-btn" data-id="${u.id}" title="Jump to view">
              View
            </button>
          </div>
        `;

        item.querySelector(".jump-to-user-btn")?.addEventListener("click", () => {
          this.syncCameraToUser(u);
        });

        listEl.appendChild(item);
      });
    }

    if (chatContainer) {
      chatContainer.innerHTML = "";
      this.chatMessages.forEach((msg) => {
        const msgEl = document.createElement("div");
        msgEl.className = `collab-chat-bubble ${msg.userId === this.currentUser.id ? "is-me" : ""}`;
        
        const pinBtn = msg.coordinatePin
          ? `<button class="btn-chat-pin" title="Teleport Camera to Pin">📍 Teleport to [${msg.coordinatePin[0].toFixed(1)}, ${msg.coordinatePin[1].toFixed(1)}]</button>`
          : "";

        msgEl.innerHTML = `
          <div class="chat-meta">
            <span class="chat-author" style="color: ${msg.userColor};">${msg.userName}</span>
            <span class="chat-time">${msg.timestamp}</span>
          </div>
          <div class="chat-body">${msg.text}</div>
          ${pinBtn}
        `;

        if (msg.coordinatePin) {
          msgEl.querySelector(".btn-chat-pin")?.addEventListener("click", () => {
            this.teleportToPin(msg.coordinatePin!);
          });
        }

        chatContainer.appendChild(msgEl);
      });
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }
}
