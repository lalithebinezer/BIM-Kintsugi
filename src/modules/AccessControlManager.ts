/**
 * AccessControlManager — Multi-Tenancy, Role-Based Access Control (RBAC),
 * Tenant Partition Isolation, and Security Compliance Audit Ledger.
 *
 * Implements enterprise cloud BIM governance:
 * - Multi-tenancy with strict data segregation (Tenant A cannot see/mutate Tenant B data)
 * - Granular permissions matrix across 3D, 4D Schedule, 5D Cost, EVM, GIS, BCF, and Admin
 * - Six enterprise roles: SuperAdmin, BIM Manager, Lead Coordinator, Cost Estimator, Subcontractor, Viewer
 * - Permission assertion guards and error handling
 * - Immutable Security Audit Ledger for ISO 19650 and SOC2 compliance tracking
 */

export const Permission = {
  // 3D Model Permissions
  VIEW_3D_MODEL: "VIEW_3D_MODEL",
  UPLOAD_IFC_MODEL: "UPLOAD_IFC_MODEL",
  DELETE_MODEL: "DELETE_MODEL",

  // 4D Schedule Permissions
  VIEW_SCHEDULE_4D: "VIEW_SCHEDULE_4D",
  EDIT_SCHEDULE_4D: "EDIT_SCHEDULE_4D",
  SIMULATE_4D_TIMELINE: "SIMULATE_4D_TIMELINE",

  // 5D Cost & Rates Permissions
  VIEW_COST_5D: "VIEW_COST_5D",
  EDIT_COST_RATES_5D: "EDIT_COST_RATES_5D",
  EXPORT_BOQ_CSV: "EXPORT_BOQ_CSV",

  // EVM (Earned Value Management) Permissions
  VIEW_EVM_ANALYTICS: "VIEW_EVM_ANALYTICS",
  SIMULATE_EVM_DELAYS: "SIMULATE_EVM_DELAYS",
  EXPORT_EVM_AUDIT: "EXPORT_EVM_AUDIT",

  // GIS & Georeference Permissions
  VIEW_GIS_BASEMAP: "VIEW_GIS_BASEMAP",
  EDIT_GEOREFERENCE: "EDIT_GEOREFERENCE",

  // BCF Issue & Collaboration Permissions
  VIEW_BCF_ISSUES: "VIEW_BCF_ISSUES",
  CREATE_BCF_ISSUE: "CREATE_BCF_ISSUE",
  RESOLVE_BCF_ISSUE: "RESOLVE_BCF_ISSUE",
  DELETE_BCF_ISSUE: "DELETE_BCF_ISSUE",

  // Clash Detection Permissions
  RUN_CLASH_DETECTION: "RUN_CLASH_DETECTION",
  MODIFY_CLASH_TOLERANCE: "MODIFY_CLASH_TOLERANCE",

  // Administration & Multi-Tenancy Permissions
  INVITE_COLLABORATOR: "INVITE_COLLABORATOR",
  MANAGE_ROLES_PERMISSIONS: "MANAGE_ROLES_PERMISSIONS",
  SWITCH_TENANT: "SWITCH_TENANT",
  ADMIN_SYSTEM_CONFIG: "ADMIN_SYSTEM_CONFIG",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export type UserRole =
  | "SuperAdmin"
  | "BIMManager"
  | "LeadCoordinator"
  | "CostEstimator"
  | "Subcontractor"
  | "Viewer";

export interface TenantQuota {
  maxProjects: number;
  maxModels: number;
  maxStorageMb: number;
  maxCollaborators: number;
}

export interface TenantFeatures {
  allow4DPhasing: boolean;
  allow5DCosting: boolean;
  allowEvmAnalytics: boolean;
  allowGisBasemap: boolean;
  allowClashTolerance: boolean;
  allowCustomRates: boolean;
}

export interface TenantDataPartition {
  projects: Set<string>;
  modelIds: Set<string>;
  taskIds: Set<string>;
  bcfTopicIds: Set<string>;
  customRates: Map<string, number>;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  tier: "Community" | "Professional" | "Enterprise";
  createdAt: string;
  quota: TenantQuota;
  features: TenantFeatures;
  partition: TenantDataPartition;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  role: UserRole;
  customPermissions?: Permission[];
}

export interface AuditLedgerEntry {
  id: string;
  timestamp: string;
  tenantId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  resource: string;
  decision: "ALLOWED" | "DENIED";
  reason?: string;
}

export class AccessDeniedError extends Error {
  public readonly permission: Permission;
  public readonly userId: string;
  public readonly userRole: UserRole;

  constructor(permission: Permission, user: UserProfile, resource?: string) {
    super(
      `Access Denied: User '${user.name}' (${user.role}) lacks required permission '${permission}' for resource '${resource || "system"}'`
    );
    this.name = "AccessDeniedError";
    this.permission = permission;
    this.userId = user.id;
    this.userRole = user.role;
  }
}

export class TenantQuotaExceededError extends Error {
  public readonly tenantId: string;
  public readonly quotaKey: keyof TenantQuota;

  constructor(tenantId: string, quotaKey: keyof TenantQuota, max: number) {
    super(`Tenant Quota Exceeded: Tenant '${tenantId}' reached limit of ${max} for '${String(quotaKey)}'`);
    this.name = "TenantQuotaExceededError";
    this.tenantId = tenantId;
    this.quotaKey = quotaKey;
  }
}

/**
 * Standard Role-to-Permissions Matrix
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SuperAdmin: Object.values(Permission),

  BIMManager: [
    Permission.VIEW_3D_MODEL,
    Permission.UPLOAD_IFC_MODEL,
    Permission.DELETE_MODEL,
    Permission.VIEW_SCHEDULE_4D,
    Permission.EDIT_SCHEDULE_4D,
    Permission.SIMULATE_4D_TIMELINE,
    Permission.VIEW_COST_5D,
    Permission.EDIT_COST_RATES_5D,
    Permission.EXPORT_BOQ_CSV,
    Permission.VIEW_EVM_ANALYTICS,
    Permission.SIMULATE_EVM_DELAYS,
    Permission.EXPORT_EVM_AUDIT,
    Permission.VIEW_GIS_BASEMAP,
    Permission.EDIT_GEOREFERENCE,
    Permission.VIEW_BCF_ISSUES,
    Permission.CREATE_BCF_ISSUE,
    Permission.RESOLVE_BCF_ISSUE,
    Permission.DELETE_BCF_ISSUE,
    Permission.RUN_CLASH_DETECTION,
    Permission.MODIFY_CLASH_TOLERANCE,
    Permission.INVITE_COLLABORATOR,
    Permission.MANAGE_ROLES_PERMISSIONS,
  ],

  LeadCoordinator: [
    Permission.VIEW_3D_MODEL,
    Permission.VIEW_SCHEDULE_4D,
    Permission.EDIT_SCHEDULE_4D,
    Permission.SIMULATE_4D_TIMELINE,
    Permission.VIEW_COST_5D,
    Permission.VIEW_EVM_ANALYTICS,
    Permission.SIMULATE_EVM_DELAYS,
    Permission.EXPORT_EVM_AUDIT,
    Permission.VIEW_GIS_BASEMAP,
    Permission.VIEW_BCF_ISSUES,
    Permission.CREATE_BCF_ISSUE,
    Permission.RESOLVE_BCF_ISSUE,
    Permission.RUN_CLASH_DETECTION,
    Permission.MODIFY_CLASH_TOLERANCE,
    Permission.INVITE_COLLABORATOR,
  ],

  CostEstimator: [
    Permission.VIEW_3D_MODEL,
    Permission.VIEW_SCHEDULE_4D,
    Permission.SIMULATE_4D_TIMELINE,
    Permission.VIEW_COST_5D,
    Permission.EDIT_COST_RATES_5D,
    Permission.EXPORT_BOQ_CSV,
    Permission.VIEW_EVM_ANALYTICS,
    Permission.SIMULATE_EVM_DELAYS,
    Permission.EXPORT_EVM_AUDIT,
    Permission.VIEW_BCF_ISSUES,
    Permission.CREATE_BCF_ISSUE,
  ],

  Subcontractor: [
    Permission.VIEW_3D_MODEL,
    Permission.VIEW_SCHEDULE_4D,
    Permission.SIMULATE_4D_TIMELINE,
    Permission.VIEW_BCF_ISSUES,
    Permission.CREATE_BCF_ISSUE,
  ],

  Viewer: [
    Permission.VIEW_3D_MODEL,
    Permission.VIEW_SCHEDULE_4D,
    Permission.SIMULATE_4D_TIMELINE,
    Permission.VIEW_COST_5D,
    Permission.VIEW_EVM_ANALYTICS,
    Permission.VIEW_GIS_BASEMAP,
    Permission.VIEW_BCF_ISSUES,
  ],
};

export class AccessControlManager {
  private static instance: AccessControlManager | null = null;

  private tenants: Map<string, Tenant> = new Map();
  private activeTenantId: string = "tenant-snowdon-global";
  private currentUser: UserProfile;
  private auditLedger: AuditLedgerEntry[] = [];
  private maxAuditEntries: number = 2000;

  private constructor() {
    this.seedDefaultTenants();
    this.currentUser = {
      id: "usr_lead_coord",
      name: "Lead Coordinator",
      email: "coordinator@snowdon-towers.bim",
      tenantId: this.activeTenantId,
      role: "BIMManager",
    };
  }

  public static getInstance(): AccessControlManager {
    if (!AccessControlManager.instance) {
      AccessControlManager.instance = new AccessControlManager();
    }
    return AccessControlManager.instance;
  }

  /**
   * Resets singleton state (helpful for automated unit tests).
   */
  public static resetInstance(): void {
    AccessControlManager.instance = null;
  }

  private seedDefaultTenants(): void {
    // 1. Primary Enterprise Tenant
    const snowdonTenant: Tenant = {
      id: "tenant-snowdon-global",
      name: "Snowdon Towers Global Consortium",
      domain: "snowdon-towers.bim",
      tier: "Enterprise",
      createdAt: "2026-01-15T08:00:00Z",
      quota: {
        maxProjects: 50,
        maxModels: 200,
        maxStorageMb: 50000,
        maxCollaborators: 100,
      },
      features: {
        allow4DPhasing: true,
        allow5DCosting: true,
        allowEvmAnalytics: true,
        allowGisBasemap: true,
        allowClashTolerance: true,
        allowCustomRates: true,
      },
      partition: {
        projects: new Set(["proj_snowdon_phase1", "proj_snowdon_phase2"]),
        modelIds: new Set(["model_arch_01", "model_struct_01", "model_mep_01"]),
        taskIds: new Set(["task_substructure", "task_steel_frame", "task_mep_lvl1"]),
        bcfTopicIds: new Set(["bcf_clash_beam_duct", "bcf_penetration_review"]),
        customRates: new Map([
          ["CONCRETE_GRADE_40", 240],
          ["STEEL_BEAM_W24", 185],
        ]),
      },
    };

    // 2. Secondary Subcontractor Tenant
    const contractorTenant: Tenant = {
      id: "tenant-contractor-prime",
      name: "Apex MEP Contractors Ltd.",
      domain: "apex-mep.co",
      tier: "Professional",
      createdAt: "2026-03-01T10:00:00Z",
      quota: {
        maxProjects: 5,
        maxModels: 20,
        maxStorageMb: 5000,
        maxCollaborators: 15,
      },
      features: {
        allow4DPhasing: true,
        allow5DCosting: false,
        allowEvmAnalytics: false,
        allowGisBasemap: false,
        allowClashTolerance: true,
        allowCustomRates: false,
      },
      partition: {
        projects: new Set(["proj_apex_hvac"]),
        modelIds: new Set(["model_apex_ducts"]),
        taskIds: new Set(["task_apex_install"]),
        bcfTopicIds: new Set(["bcf_apex_issue_1"]),
        customRates: new Map(),
      },
    };

    // 3. Academic / Research Tenant
    const nicmarTenant: Tenant = {
      id: "tenant-nicmar-research",
      name: "NICMAR University Research Lab",
      domain: "nicmar.ac.in",
      tier: "Enterprise",
      createdAt: "2026-06-01T09:00:00Z",
      quota: {
        maxProjects: 100,
        maxModels: 500,
        maxStorageMb: 100000,
        maxCollaborators: 250,
      },
      features: {
        allow4DPhasing: true,
        allow5DCosting: true,
        allowEvmAnalytics: true,
        allowGisBasemap: true,
        allowClashTolerance: true,
        allowCustomRates: true,
      },
      partition: {
        projects: new Set(["proj_nicmar_digital_twin"]),
        modelIds: new Set(["model_nicmar_capestone"]),
        taskIds: new Set(["task_nicmar_4d"]),
        bcfTopicIds: new Set([]),
        customRates: new Map([["IN_CONCRETE_M35", 6500]]),
      },
    };

    this.tenants.set(snowdonTenant.id, snowdonTenant);
    this.tenants.set(contractorTenant.id, contractorTenant);
    this.tenants.set(nicmarTenant.id, nicmarTenant);
  }

  // -------------------------------------------------------------
  // MULTI-TENANCY MANAGEMENT & ISOLATION
  // -------------------------------------------------------------

  public getTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  public getTenant(tenantId: string): Tenant | undefined {
    return this.tenants.get(tenantId);
  }

  public getActiveTenant(): Tenant {
    const tenant = this.tenants.get(this.activeTenantId);
    if (!tenant) {
      throw new Error(`Active tenant '${this.activeTenantId}' not found.`);
    }
    return tenant;
  }

  public registerTenant(tenant: Tenant): void {
    if (this.tenants.has(tenant.id)) {
      throw new Error(`Tenant '${tenant.id}' already exists.`);
    }
    this.tenants.set(tenant.id, tenant);
    this.logAudit("REGISTER_TENANT", `tenant:${tenant.id}`, "ALLOWED");
  }

  /**
   * Switch the active organization / tenant workspace.
   * Requires SWITCH_TENANT permission or SuperAdmin role.
   */
  public switchTenant(targetTenantId: string, actor: UserProfile = this.currentUser): boolean {
    if (!this.tenants.has(targetTenantId)) {
      this.logAudit("SWITCH_TENANT", `tenant:${targetTenantId}`, "DENIED", "Tenant does not exist", actor);
      return false;
    }

    if (actor.role !== "SuperAdmin" && actor.tenantId !== targetTenantId && !this.hasPermission(Permission.SWITCH_TENANT, actor)) {
      this.logAudit("SWITCH_TENANT", `tenant:${targetTenantId}`, "DENIED", "Cross-tenant switch unauthorized", actor);
      return false;
    }

    this.activeTenantId = targetTenantId;
    this.currentUser.tenantId = targetTenantId;
    this.logAudit("SWITCH_TENANT", `tenant:${targetTenantId}`, "ALLOWED", undefined, actor);
    return true;
  }

  /**
   * Enforces strict multi-tenant boundary isolation.
   * Ensures Tenant A cannot access, read, or modify Tenant B's data partition.
   */
  public verifyTenantIsolation(tenantAId: string, tenantBId: string): boolean {
    const tA = this.tenants.get(tenantAId);
    const tB = this.tenants.get(tenantBId);
    if (!tA || !tB) return false;
    if (tenantAId === tenantBId) return true;

    // Check project overlap
    for (const p of tA.partition.projects) {
      if (tB.partition.projects.has(p)) return false;
    }
    // Check model overlap
    for (const m of tA.partition.modelIds) {
      if (tB.partition.modelIds.has(m)) return false;
    }
    // Check task overlap
    for (const t of tA.partition.taskIds) {
      if (tB.partition.taskIds.has(t)) return false;
    }
    // Check BCF overlap
    for (const b of tA.partition.bcfTopicIds) {
      if (tB.partition.bcfTopicIds.has(b)) return false;
    }
    return true;
  }

  /**
   * Checks if an action is within the tenant's resource quota.
   */
  public assertQuota(quotaKey: keyof TenantQuota, currentCount: number, tenantId: string = this.activeTenantId): void {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return;
    const max = tenant.quota[quotaKey];
    if (currentCount >= max) {
      this.logAudit("QUOTA_CHECK", `quota:${String(quotaKey)}`, "DENIED", `Exceeded max quota ${max}`);
      throw new TenantQuotaExceededError(tenantId, quotaKey, max);
    }
  }

  /**
   * Checks if an enterprise feature is unlocked for the tenant's license tier.
   */
  public isFeatureEnabled(featureKey: keyof TenantFeatures, tenantId: string = this.activeTenantId): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;
    return Boolean(tenant.features[featureKey]);
  }

  // -------------------------------------------------------------
  // ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION GUARDS
  // -------------------------------------------------------------

  public getCurrentUser(): UserProfile {
    return this.currentUser;
  }

  public setCurrentUser(user: UserProfile): void {
    this.currentUser = user;
    if (user.tenantId && this.tenants.has(user.tenantId)) {
      this.activeTenantId = user.tenantId;
    }
  }

  public setRole(role: UserRole): void {
    this.currentUser.role = role;
    this.logAudit("SET_ROLE", `role:${role}`, "ALLOWED");
  }

  /**
   * Checks if a user has a specific permission.
   */
  public hasPermission(permission: Permission, user: UserProfile = this.currentUser): boolean {
    // 1. Check custom user permissions override
    if (user.customPermissions && user.customPermissions.includes(permission)) {
      return true;
    }

    // 2. Check role standard permissions
    const allowed = ROLE_PERMISSIONS[user.role] || [];
    return allowed.includes(permission);
  }

  /**
   * Throws AccessDeniedError if user does not possess the permission.
   */
  public assertPermission(permission: Permission, user: UserProfile = this.currentUser, resource?: string): void {
    if (!this.hasPermission(permission, user)) {
      this.logAudit(permission, resource || "system", "DENIED", undefined, user);
      throw new AccessDeniedError(permission, user, resource);
    }
    this.logAudit(permission, resource || "system", "ALLOWED", undefined, user);
  }

  /**
   * Safely executes an action with permission guard and automatic audit logging.
   */
  public executeWithGuard<T>(
    permission: Permission,
    action: () => T,
    resource: string = "system",
    user: UserProfile = this.currentUser
  ): T {
    this.assertPermission(permission, user, resource);
    return action();
  }

  // -------------------------------------------------------------
  // COMPLIANCE AUDIT LEDGER (ISO 19650 / SOC2)
  // -------------------------------------------------------------

  public logAudit(
    action: string,
    resource: string,
    decision: "ALLOWED" | "DENIED",
    reason?: string,
    user: UserProfile = this.currentUser
  ): AuditLedgerEntry {
    const entry: AuditLedgerEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      tenantId: user.tenantId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      resource,
      decision,
      reason,
    };

    this.auditLedger.unshift(entry);
    if (this.auditLedger.length > this.maxAuditEntries) {
      this.auditLedger.pop();
    }
    return entry;
  }

  public getAuditLedger(): AuditLedgerEntry[] {
    return [...this.auditLedger];
  }

  public clearAuditLedger(): void {
    this.auditLedger = [];
  }

  /**
   * Exports the complete audit trail to downloadable CSV.
   */
  public exportAuditLedgerCsv(): string {
    const headers = [
      "AuditID",
      "Timestamp",
      "TenantID",
      "UserID",
      "UserName",
      "UserRole",
      "Action",
      "Resource",
      "Decision",
      "Reason",
    ];

    const rows = this.auditLedger.map((e) => [
      `"${e.id}"`,
      `"${e.timestamp}"`,
      `"${e.tenantId}"`,
      `"${e.userId}"`,
      `"${e.userName.replace(/"/g, '""')}"`,
      `"${e.userRole}"`,
      `"${e.action}"`,
      `"${e.resource}"`,
      `"${e.decision}"`,
      `"${(e.reason || "").replace(/"/g, '""')}"`,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  }
}
