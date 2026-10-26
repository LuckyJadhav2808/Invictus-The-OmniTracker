import { describe, it, expect, afterEach } from "vitest";
import {
  PROD_DB_NAME,
  SANDBOX_DB_NAME,
  TEST_DB_NAME,
  resolveDatabaseForRequest,
  assertDatabaseSafety,
} from "./mongodb";

describe("MongoDB Multi-Database Segregation & Air-Gap Security", () => {
  const originalEnv = process.env.NODE_ENV;

  function setNodeEnv(val: string | undefined) {
    (process.env as any).NODE_ENV = val;
  }

  afterEach(() => {
    setNodeEnv(originalEnv);
  });

  describe("Database Name Constants", () => {
    it("should preserve 'invictus_db' as default production database to safeguard existing users", () => {
      // By default or through MONGODB_DB_NAME, PROD_DB_NAME must be invictus_db
      expect(PROD_DB_NAME).toBe(process.env.MONGODB_DB_NAME || "invictus_db");
    });

    it("should define separate sandbox and test database names", () => {
      expect(SANDBOX_DB_NAME).toBe(process.env.MONGODB_SANDBOX_DB_NAME || "invictus_sandbox");
      expect(TEST_DB_NAME).toBe(process.env.MONGODB_TEST_DB_NAME || "invictus_test");
      expect(SANDBOX_DB_NAME).not.toBe(PROD_DB_NAME);
      expect(TEST_DB_NAME).not.toBe(PROD_DB_NAME);
    });
  });

  describe("resolveDatabaseForRequest", () => {
    it("should resolve to TEST_DB_NAME when NODE_ENV is 'test'", () => {
      setNodeEnv("test");
      const req = new Request("http://localhost:3000/api/tasks?userId=user_123");
      const context = resolveDatabaseForRequest(req);

      expect(context.isTest).toBe(true);
      expect(context.targetDb).toBe(TEST_DB_NAME);
      expect(context.userId).toBe("user_123");
    });

    it("should resolve to SANDBOX_DB_NAME for guest users even in production mode", () => {
      setNodeEnv("production");
      const req = new Request("http://localhost:3000/api/tasks?userId=guest-user");
      const context = resolveDatabaseForRequest(req);

      expect(context.isSandbox).toBe(true);
      expect(context.targetDb).toBe(SANDBOX_DB_NAME);
      expect(context.userId).toBe("guest-user");
    });

    it("should resolve to SANDBOX_DB_NAME for demo evaluator users (demo_*) in production mode", () => {
      setNodeEnv("production");
      const req = new Request("http://localhost:3000/api/tasks?userId=demo_evaluator_99");
      const context = resolveDatabaseForRequest(req);

      expect(context.isSandbox).toBe(true);
      expect(context.targetDb).toBe(SANDBOX_DB_NAME);
      expect(context.userId).toBe("demo_evaluator_99");
    });

    it("should resolve to SANDBOX_DB_NAME when x-invictus-environment header is sandbox", () => {
      setNodeEnv("production");
      const req = new Request("http://localhost:3000/api/tasks", {
        headers: {
          "x-invictus-environment": "sandbox",
        },
      });
      const context = resolveDatabaseForRequest(req);

      expect(context.isSandbox).toBe(true);
      expect(context.targetDb).toBe(SANDBOX_DB_NAME);
    });

    it("should resolve to SANDBOX_DB_NAME when x-invictus-sandbox header is true", () => {
      setNodeEnv("production");
      const req = new Request("http://localhost:3000/api/tasks", {
        headers: {
          "x-invictus-sandbox": "true",
        },
      });
      const context = resolveDatabaseForRequest(req);

      expect(context.isSandbox).toBe(true);
      expect(context.targetDb).toBe(SANDBOX_DB_NAME);
    });

    it("should resolve to PROD_DB_NAME for real users in production mode with no sandbox headers", () => {
      setNodeEnv("production");
      const req = new Request("http://localhost:3000/api/tasks?userId=user_1kapw9sad_1784744868999");
      const context = resolveDatabaseForRequest(req);

      expect(context.isSandbox).toBe(false);
      expect(context.isTest).toBe(false);
      expect(context.targetDb).toBe(PROD_DB_NAME);
      expect(context.userId).toBe("user_1kapw9sad_1784744868999");
    });

    it("should accept fallback userId parameter when not in query parameters", () => {
      setNodeEnv("production");
      const req = new Request("http://localhost:3000/api/tasks", {
        method: "POST",
      });
      const context = resolveDatabaseForRequest(req, "guest-user");

      expect(context.isSandbox).toBe(true);
      expect(context.targetDb).toBe(SANDBOX_DB_NAME);
      expect(context.userId).toBe("guest-user");
    });
  });

  describe("assertDatabaseSafety (Hard Air-Gap Guard)", () => {
    it("should throw a security violation error if guest-user targets production database", () => {
      expect(() => {
        assertDatabaseSafety(PROD_DB_NAME, "guest-user");
      }).toThrowError(/\[SECURITY AIR-GAP VIOLATION\]/);
    });

    it("should throw a security violation error if demo user targets production database", () => {
      expect(() => {
        assertDatabaseSafety(PROD_DB_NAME, "demo_tester_42");
      }).toThrowError(/\[SECURITY AIR-GAP VIOLATION\]/);
    });

    it("should NOT throw when guest user targets sandbox database", () => {
      expect(() => {
        assertDatabaseSafety(SANDBOX_DB_NAME, "guest-user");
      }).not.toThrow();
    });

    it("should NOT throw when guest user targets test database", () => {
      expect(() => {
        assertDatabaseSafety(TEST_DB_NAME, "guest-user");
      }).not.toThrow();
    });

    it("should NOT throw when real authenticated user targets production database", () => {
      expect(() => {
        assertDatabaseSafety(PROD_DB_NAME, "user_1kapw9sad_1784744868999");
      }).not.toThrow();
    });
  });
});
