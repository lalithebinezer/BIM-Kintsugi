import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";

export interface CollabUser {
  id: string;
  name: string;
  role: string;
  color: string;
  avatarUrl?: string;
  isHost?: boolean;
  cursorPosition: [number, number, number];
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  lastActive: string;
}

export class CollaborationManager {
  private static instance: CollaborationManager;
  private engine: BimEngine;
  private activeUsers: CollabUser[] = [];
  private currentUser: CollabUser;
  private isFollowHostActive: boolean = false;
  private broadcastChannel: BroadcastChannel | null = null;
  private avatarGroup: THREE.Group;

  private userColors = ["#D4FF3F", "#38BDF8", "#F43F5E", "#A855F7", "#F59E0B", "#10B981"];

  private constructor() {
    this.engine = BimEngine.getInstance();
    this.avatarGroup = new THREE.Group();
    this.avatarGroup.name = "CollabAvatarGroup";

    if (this.engine.world?.scene?.three) {
      this.engine.world.scene.three.add(this.avatarGroup);
    }

    const randomColor = this.userColors[Math.floor(Math.random() * this.userColors.length)];
    this.currentUser = {
      id: `user_${Math.random().toString(36).substring(2, 8)}`,
      name: "You (Reviewer)",
      role: "Lead Coordinator",
      color: randomColor,
      cursorPosition: [0, 0, 0],
      cameraPosition: [15, 20, 25],
      cameraTarget: [0, 0, 0],
      lastActive: "Just now",
    };

    this.initBroadcastChannel();
    this.seedDefaultCollabPeers();
    this.bindPointerTracking();
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

  public getActiveUsers(): CollabUser[] {
    return [this.currentUser, ...this.activeUsers];
  }

  public toggleFollowHost(active?: boolean): boolean {
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

  private initBroadcastChannel() {
    if (typeof BroadcastChannel !== "undefined") {
      try {
        this.broadcastChannel = new BroadcastChannel("bim_kintsugi_collab_v1");
        this.broadcastChannel.onmessage = (event) => {
          const { type, data } = event.data;
          if (type === "user_presence" && data.id !== this.currentUser.id) {
            this.handlePeerPresence(data);
          }
        };

        // Broadcast presence
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
        cursorPosition: [4.2, 3.8, -8.5],
        cameraPosition: [12, 14, 18],
        cameraTarget: [4, 3, -8],
        lastActive: "Active now",
      },
      {
        id: "peer_str",
        name: "David Chen",
        role: "Structural Consultant",
        color: "#F43F5E",
        cursorPosition: [-6.8, 3.2, 12.1],
        cameraPosition: [-10, 15, 20],
        cameraTarget: [-6, 3, 12],
        lastActive: "1m ago",
      },
      {
        id: "peer_pm",
        name: "Sarah Miller",
        role: "BIM Manager",
        color: "#A855F7",
        cursorPosition: [1.5, 2.7, 5.0],
        cameraPosition: [8, 12, 14],
        cameraTarget: [1, 2, 5],
        lastActive: "Active now",
      },
    ];

    this.renderPeerAvatars();
  }

  private bindPointerTracking() {
    if (typeof window === "undefined") return;

    window.addEventListener("pointermove", () => {
      // Periodic throttle
      if (Math.random() > 0.3) return;
      const cam = this.engine.world?.camera;
      if (cam && cam.three) {
        this.currentUser.cameraPosition = [
          cam.three.position.x,
          cam.three.position.y,
          cam.three.position.z,
        ];
      }
      this.broadcastMyPresence();
    });
  }

  private broadcastMyPresence() {
    if (this.broadcastChannel) {
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

  private syncCameraToUser(user: CollabUser) {
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

  private renderPeerAvatars() {
    while (this.avatarGroup.children.length > 0) {
      const child = this.avatarGroup.children[0];
      this.avatarGroup.remove(child);
    }

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
    const followBtn = document.getElementById("btn-follow-host");

    const allUsers = this.getActiveUsers();
    if (countBadge) countBadge.innerText = `${allUsers.length} Online`;

    if (followBtn) {
      followBtn.classList.toggle("active", this.isFollowHostActive);
      followBtn.innerText = this.isFollowHostActive ? "Following Presenter" : "Follow Presenter";
    }

    if (listEl) {
      listEl.innerHTML = "";
      allUsers.forEach((u) => {
        const item = document.createElement("div");
        item.className = `collab-user-item ${u.isHost ? "is-host" : ""}`;
        item.innerHTML = `
          <div class="user-avatar-indicator" style="background-color: ${u.color};">
            ${u.name.substring(0, 1)}
          </div>
          <div class="user-meta">
            <span class="user-name">${u.name} ${u.isHost ? "👑" : ""}</span>
            <span class="user-role">${u.role}</span>
          </div>
          <button class="btn-xs btn-outline jump-to-user-btn" data-id="${u.id}" title="Jump to view">
            View
          </button>
        `;

        item.querySelector(".jump-to-user-btn")?.addEventListener("click", () => {
          this.syncCameraToUser(u);
        });

        listEl.appendChild(item);
      });
    }
  }
}
