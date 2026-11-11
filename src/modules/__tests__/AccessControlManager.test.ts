import { describe, it, expect, beforeEach } from "vitest";
import {
  AccessControlManager,
  Permission,
  type UserProfile,
  type Tenant,
  AccessDeniedError,
  TenantQuotaExceededError,
  ROLE_PERMISSIONS,
} from "../AccessControlManager";

describe("Multi-Tenancy and Access Control (RBAC) Tests", () => {
  let acm: AccessControlManager;

  beforeEach(() => {
    AccessControlManager.resetInstance();
    acm = AccessControlManager.getInstance();
  });

  describe("1. Multi-Tenancy & Partition Boundary Isolation", () => {
    it("should initialize default enterprise tenants with isolated partitions", () => {
      const tenants = acm.getTenants();
      expect(tenants.length).toBeGreaterThanOrEqual(3);

      const snowdon = acm.getTenant("tenant-snowdon-global");
      const apex = acm.getTenant("tenant-contractor-prime");
      const nicmar = acm.getTenant("tenant-nicmar-research");

      expect(snowdon).toBeDefined();
      expect(apex).toBeDefined();
      expect(nicmar).toBeDefined();

      expect(snowdon?.tier).toBe("Enterprise");
      expect(apex?.tier).toBe("Professional");
      expect(nicmar?.tier).toBe("Enterprise");
    });

    it("should guarantee strict data partition isolation between tenants", () => {
      const isolated = acm.verifyTenantIsolation("tenant-snowdon-global", "tenant-contractor-prime");
      expect(isolated).toBe(true);

      const isolatedWithNicmar = acm.verifyTenantIsolation("tenant-snowdon-global", "tenant-nicmar-research");
      expect(isolatedWithNicmar).toBe(true);
    });

    it("should detect and flag illegal cross-tenant data collisions", () => {
      // Register a rogue tenant with overlapping model ID
      const rogueTenant: Tenant = {
        id: "tenant-rogue",
        name: "Rogue Data Intruder",
        domain: "rogue.bad",
        tier: "Community",
        createdAt: new Date().toISOString(),
        quota: { maxProjects: 1, maxModels: 1, maxStorageMb: 100, maxCollaborators: 1 },
        features: {
          allow4DPhasing: false,
          allow5DCosting: false,
          allowEvmAnalytics: false,
          allowGisBasemap: false,
          allowClashTolerance: false,
          allowCustomRates: false,
        },
        partition: {
          projects: new Set(["proj_rogue"]),
          modelIds: new Set(["model_arch_01"]), // Overlaps with snowdon-global!
          taskIds: new Set(),
          bcfTopicIds: new Set(),
          customRates: new Map(),
        },
      };

      acm.registerTenant(rogueTenant);

      const isolationCheck = acm.verifyTenantIsolation("tenant-snowdon-global", "tenant-rogue");
      expect(isolationCheck).toBe(false); // Detected cross-tenant leak!
    });

    it("should enforce tenant resource quotas and throw TenantQuotaExceededError", () => {
      const activeTenant = acm.getActiveTenant();
      expect(activeTenant.quota.maxProjects).toBe(50);

      // Within quota
      expect(() => acm.assertQuota("maxProjects", 49)).not.toThrow();

      // Exceeded quota
      expect(() => acm.assertQuota("maxProjects", 50)).toThrow(TenantQuotaExceededError);
    });

    it("should correctly gate feature access according to tenant license tier", () => {
      // Snowdon has Enterprise tier -> 5D and EVM enabled
      expect(acm.isFeatureEnabled("allow5DCosting", "tenant-snowdon-global")).toBe(true);
      expect(acm.isFeatureEnabled("allowEvmAnalytics", "tenant-snowdon-global")).toBe(true);
      expect(acm.isFeatureEnabled("allowGisBasemap", "tenant-snowdon-global")).toBe(true);

      // Apex Subcontractor has Professional tier -> 5D & EVM disabled
      expect(acm.isFeatureEnabled("allow5DCosting", "tenant-contractor-prime")).toBe(false);
      expect(acm.isFeatureEnabled("allowEvmAnalytics", "tenant-contractor-prime")).toBe(false);
      expect(acm.isFeatureEnabled("allow4DPhasing", "tenant-contractor-prime")).toBe(true);
    });

    it("should allow SuperAdmin to switch tenants and block unauthorized users", () => {
      const superAdminUser: UserProfile = {
        id: "usr_admin",
        name: "Enterprise Admin",
        email: "admin@kintsugi.bim",
        tenantId: "tenant-snowdon-global",
        role: "SuperAdmin",
      };

      // SuperAdmin can switch
      const switchSuccess = acm.switchTenant("tenant-contractor-prime", superAdminUser);
      expect(switchSuccess).toBe(true);
      expect(acm.getActiveTenant().id).toBe("tenant-contractor-prime");

      // Regular Viewer cannot switch cross-tenant
      const viewerUser: UserProfile = {
        id: "usr_viewer",
        name: "Guest Auditor",
        email: "auditor@guest.com",
        tenantId: "tenant-contractor-prime",
        role: "Viewer",
      };

      const unauthorizedSwitch = acm.switchTenant("tenant-snowdon-global", viewerUser);
      expect(unauthorizedSwitch).toBe(false);
    });
  });

  describe("2. Role-Based Access Control (RBAC) & Permissions Matrix", () => {
    it("SuperAdmin should possess every defined system permission", () => {
      const allPermissions = Object.values(Permission);
      const superAdminPermissions = ROLE_PERMISSIONS["SuperAdmin"];

      for (const p of allPermissions) {
        expect(superAdminPermissions).toContain(p);
      }
    });

    it("BIMManager should possess project model, 4D, 5D, and BCF administration permissions", () => {
      const managerUser: UserProfile = {
        id: "usr_bim_mgr",
        name: "Sarah Miller",
        email: "sarah@snowdon.bim",
        tenantId: "tenant-snowdon-global",
        role: "BIMManager",
      };

      expect(acm.hasPermission(Permission.UPLOAD_IFC_MODEL, managerUser)).toBe(true);
      expect(acm.hasPermission(Permission.DELETE_MODEL, managerUser)).toBe(true);
      expect(acm.hasPermission(Permission.EDIT_SCHEDULE_4D, managerUser)).toBe(true);
      expect(acm.hasPermission(Permission.EDIT_COST_RATES_5D, managerUser)).toBe(true);
      expect(acm.hasPermission(Permission.EXPORT_BOQ_CSV, managerUser)).toBe(true);
      expect(acm.hasPermission(Permission.SIMULATE_EVM_DELAYS, managerUser)).toBe(true);
      expect(acm.hasPermission(Permission.RESOLVE_BCF_ISSUE, managerUser)).toBe(true);
      expect(acm.hasPermission(Permission.MODIFY_CLASH_TOLERANCE, managerUser)).toBe(true);
      // But cannot reconfigure overall multi-tenant system config
      expect(acm.hasPermission(Permission.ADMIN_SYSTEM_CONFIG, managerUser)).toBe(false);
    });

    it("LeadCoordinator should edit 4D, run clash, but CANNOT edit 5D baseline rates", () => {
      const coordUser: UserProfile = {
        id: "usr_coord",
        name: "Elena Rostova",
        email: "elena@snowdon.bim",
        tenantId: "tenant-snowdon-global",
        role: "LeadCoordinator",
      };

      expect(acm.hasPermission(Permission.EDIT_SCHEDULE_4D, coordUser)).toBe(true);
      expect(acm.hasPermission(Permission.SIMULATE_4D_TIMELINE, coordUser)).toBe(true);
      expect(acm.hasPermission(Permission.RUN_CLASH_DETECTION, coordUser)).toBe(true);
      expect(acm.hasPermission(Permission.MODIFY_CLASH_TOLERANCE, coordUser)).toBe(true);
      expect(acm.hasPermission(Permission.CREATE_BCF_ISSUE, coordUser)).toBe(true);

      // Read-only on cost: can view but cannot modify 5D rates
      expect(acm.hasPermission(Permission.VIEW_COST_5D, coordUser)).toBe(true);
      expect(acm.hasPermission(Permission.EDIT_COST_RATES_5D, coordUser)).toBe(false);
      expect(acm.hasPermission(Permission.DELETE_MODEL, coordUser)).toBe(false);
    });

    it("CostEstimator should edit 5D cost rates and export BOQ, but CANNOT edit 4D schedules or delete models", () => {
      const costUser: UserProfile = {
        id: "usr_estimator",
        name: "David Chen",
        email: "david@snowdon.bim",
        tenantId: "tenant-snowdon-global",
        role: "CostEstimator",
      };

      expect(acm.hasPermission(Permission.VIEW_COST_5D, costUser)).toBe(true);
      expect(acm.hasPermission(Permission.EDIT_COST_RATES_5D, costUser)).toBe(true);
      expect(acm.hasPermission(Permission.EXPORT_BOQ_CSV, costUser)).toBe(true);
      expect(acm.hasPermission(Permission.VIEW_EVM_ANALYTICS, costUser)).toBe(true);
      expect(acm.hasPermission(Permission.EXPORT_EVM_AUDIT, costUser)).toBe(true);

      // Cost estimator cannot modify construction schedule or models
      expect(acm.hasPermission(Permission.EDIT_SCHEDULE_4D, costUser)).toBe(false);
      expect(acm.hasPermission(Permission.DELETE_MODEL, costUser)).toBe(false);
      expect(acm.hasPermission(Permission.MODIFY_CLASH_TOLERANCE, costUser)).toBe(false);
    });

    it("Subcontractor should have restricted field-level access", () => {
      const subUser: UserProfile = {
        id: "usr_sub",
        name: "Field Subcontractor",
        email: "field@sub.com",
        tenantId: "tenant-contractor-prime",
        role: "Subcontractor",
      };

      expect(acm.hasPermission(Permission.VIEW_3D_MODEL, subUser)).toBe(true);
      expect(acm.hasPermission(Permission.VIEW_SCHEDULE_4D, subUser)).toBe(true);
      expect(acm.hasPermission(Permission.VIEW_BCF_ISSUES, subUser)).toBe(true);
      expect(acm.hasPermission(Permission.CREATE_BCF_ISSUE, subUser)).toBe(true);

      // Prohibited from rates, schedule mutation, EVM export
      expect(acm.hasPermission(Permission.EDIT_COST_RATES_5D, subUser)).toBe(false);
      expect(acm.hasPermission(Permission.EDIT_SCHEDULE_4D, subUser)).toBe(false);
      expect(acm.hasPermission(Permission.EXPORT_EVM_AUDIT, subUser)).toBe(false);
      expect(acm.hasPermission(Permission.RUN_CLASH_DETECTION, subUser)).toBe(false);
    });

    it("Viewer should be strictly Read-Only with zero modification rights", () => {
      const viewerUser: UserProfile = {
        id: "usr_viewer",
        name: "Stakeholder Observer",
        email: "client@snowdon.bim",
        tenantId: "tenant-snowdon-global",
        role: "Viewer",
      };

      // Allowed read-only
      expect(acm.hasPermission(Permission.VIEW_3D_MODEL, viewerUser)).toBe(true);
      expect(acm.hasPermission(Permission.VIEW_SCHEDULE_4D, viewerUser)).toBe(true);
      expect(acm.hasPermission(Permission.VIEW_COST_5D, viewerUser)).toBe(true);
      expect(acm.hasPermission(Permission.VIEW_EVM_ANALYTICS, viewerUser)).toBe(true);
      expect(acm.hasPermission(Permission.VIEW_GIS_BASEMAP, viewerUser)).toBe(true);

      // Forbidden mutations
      expect(acm.hasPermission(Permission.UPLOAD_IFC_MODEL, viewerUser)).toBe(false);
      expect(acm.hasPermission(Permission.EDIT_SCHEDULE_4D, viewerUser)).toBe(false);
      expect(acm.hasPermission(Permission.EDIT_COST_RATES_5D, viewerUser)).toBe(false);
      expect(acm.hasPermission(Permission.CREATE_BCF_ISSUE, viewerUser)).toBe(false);
      expect(acm.hasPermission(Permission.RESOLVE_BCF_ISSUE, viewerUser)).toBe(false);
      expect(acm.hasPermission(Permission.RUN_CLASH_DETECTION, viewerUser)).toBe(false);
    });

    it("should allow granular user custom permission overrides", () => {
      const viewerWithSpecialExport: UserProfile = {
        id: "usr_special",
        name: "Special Auditor",
        email: "auditor@external.org",
        tenantId: "tenant-snowdon-global",
        role: "Viewer",
        customPermissions: [Permission.EXPORT_BOQ_CSV, Permission.EXPORT_EVM_AUDIT],
      };

      expect(acm.hasPermission(Permission.VIEW_3D_MODEL, viewerWithSpecialExport)).toBe(true);
      expect(acm.hasPermission(Permission.EXPORT_BOQ_CSV, viewerWithSpecialExport)).toBe(true);
      expect(acm.hasPermission(Permission.EXPORT_EVM_AUDIT, viewerWithSpecialExport)).toBe(true);
      expect(acm.hasPermission(Permission.EDIT_COST_RATES_5D, viewerWithSpecialExport)).toBe(false);
    });
  });

  describe("3. Permission Assertion Guards & Execution Wrapping", () => {
    it("assertPermission should throw AccessDeniedError on unauthorized action", () => {
      const viewerUser: UserProfile = {
        id: "usr_v1",
        name: "Junior Viewer",
        email: "v1@test.com",
        tenantId: "tenant-snowdon-global",
        role: "Viewer",
      };

      expect(() => {
        acm.assertPermission(Permission.EDIT_COST_RATES_5D, viewerUser, "5D_UnitRates");
      }).toThrow(AccessDeniedError);

      try {
        acm.assertPermission(Permission.EDIT_COST_RATES_5D, viewerUser, "5D_UnitRates");
      } catch (err) {
        expect(err).toBeInstanceOf(AccessDeniedError);
        const accessErr = err as AccessDeniedError;
        expect(accessErr.permission).toBe(Permission.EDIT_COST_RATES_5D);
        expect(accessErr.userId).toBe("usr_v1");
        expect(accessErr.userRole).toBe("Viewer");
        expect(accessErr.message).toContain("Access Denied");
      }
    });

    it("executeWithGuard should execute operation when authorized and prevent execution when denied", () => {
      const estimatorUser: UserProfile = {
        id: "usr_est",
        name: "Cost Estimator",
        email: "est@test.com",
        tenantId: "tenant-snowdon-global",
        role: "CostEstimator",
      };

      let rateUpdated = false;
      const result = acm.executeWithGuard(
        Permission.EDIT_COST_RATES_5D,
        () => {
          rateUpdated = true;
          return 350;
        },
        "UnitRate:Concrete",
        estimatorUser
      );

      expect(rateUpdated).toBe(true);
      expect(result).toBe(350);

      // Attempt prohibited action
      let scheduleMutated = false;
      expect(() => {
        acm.executeWithGuard(
          Permission.EDIT_SCHEDULE_4D,
          () => {
            scheduleMutated = true;
          },
          "ScheduleTask:Foundations",
          estimatorUser
        );
      }).toThrow(AccessDeniedError);

      expect(scheduleMutated).toBe(false);
    });
  });

  describe("4. Security Compliance Audit Ledger (ISO 19650 / SOC2)", () => {
    it("should log both ALLOWED and DENIED events with forensic details", () => {
      acm.clearAuditLedger();

      const viewer: UserProfile = {
        id: "usr_v",
        name: "Observer",
        email: "obs@test.com",
        tenantId: "tenant-snowdon-global",
        role: "Viewer",
      };

      // Allowed action
      acm.assertPermission(Permission.VIEW_3D_MODEL, viewer, "Model:Snowdon_Phase1");

      // Denied action
      try {
        acm.assertPermission(Permission.DELETE_MODEL, viewer, "Model:Snowdon_Phase1");
      } catch {}

      const ledger = acm.getAuditLedger();
      expect(ledger.length).toBe(2);

      expect(ledger[0].decision).toBe("DENIED");
      expect(ledger[0].action).toBe(Permission.DELETE_MODEL);
      expect(ledger[0].resource).toBe("Model:Snowdon_Phase1");
      expect(ledger[0].userRole).toBe("Viewer");

      expect(ledger[1].decision).toBe("ALLOWED");
      expect(ledger[1].action).toBe(Permission.VIEW_3D_MODEL);
    });

    it("should export audit ledger to a compliant CSV string", () => {
      acm.clearAuditLedger();
      acm.logAudit("EXPORT_EVM_AUDIT", "EVM_Ledger_2026", "ALLOWED");

      const csv = acm.exportAuditLedgerCsv();
      expect(csv).toContain("AuditID,Timestamp,TenantID,UserID,UserName,UserRole,Action,Resource,Decision,Reason");
      expect(csv).toContain("EXPORT_EVM_AUDIT");
      expect(csv).toContain("ALLOWED");
    });
  });
});
