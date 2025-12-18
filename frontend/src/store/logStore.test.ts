/**
 * LogStore Tests
 *
 * Tests for the error/event log storage system.
 *
 * @author Toaster (Senior QA Engineer)
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useLogStore } from "./logStore";
import { PilotBAError } from "../services/errorCodes";

// Helper to create test errors
function createTestError(overrides: Partial<PilotBAError> = {}): PilotBAError {
  return {
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date(),
    severity: "error",
    category: "unknown",
    code: "TEST",
    message: "Test error",
    recoverable: true,
    ...overrides,
  };
}

describe("LogStore", () => {
  beforeEach(() => {
    // Clear logs before each test
    useLogStore.getState().clearLogs();
    useLogStore.getState().setEnabled(true);
  });

  describe("addLog()", () => {
    it("should add a log entry", () => {
      const error = createTestError({ message: "Test error 1" });
      useLogStore.getState().addLog(error);

      const logs = useLogStore.getState().logs;
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe("Test error 1");
    });

    it("should add logs in reverse chronological order (newest first)", () => {
      useLogStore.getState().addLog(createTestError({ message: "First" }));
      useLogStore.getState().addLog(createTestError({ message: "Second" }));
      useLogStore.getState().addLog(createTestError({ message: "Third" }));

      const logs = useLogStore.getState().logs;
      expect(logs[0].message).toBe("Third");
      expect(logs[1].message).toBe("Second");
      expect(logs[2].message).toBe("First");
    });

    it("should limit logs to MAX_LOGS (1000)", () => {
      // Add 1100 logs
      for (let i = 0; i < 1100; i++) {
        useLogStore.getState().addLog(createTestError({ message: `Log ${i}` }));
      }

      const logs = useLogStore.getState().logs;
      expect(logs.length).toBe(1000);
      // Most recent should be first
      expect(logs[0].message).toBe("Log 1099");
    });

    it("should not add logs when disabled", () => {
      useLogStore.getState().setEnabled(false);
      useLogStore.getState().addLog(createTestError());

      expect(useLogStore.getState().logs).toHaveLength(0);
    });
  });

  describe("clearLogs()", () => {
    it("should clear all logs", () => {
      useLogStore.getState().addLog(createTestError());
      useLogStore.getState().addLog(createTestError());
      useLogStore.getState().addLog(createTestError());

      expect(useLogStore.getState().logs).toHaveLength(3);

      useLogStore.getState().clearLogs();

      expect(useLogStore.getState().logs).toHaveLength(0);
    });
  });

  describe("setEnabled()", () => {
    it("should enable/disable logging", () => {
      useLogStore.getState().setEnabled(false);
      expect(useLogStore.getState().isEnabled).toBe(false);

      useLogStore.getState().setEnabled(true);
      expect(useLogStore.getState().isEnabled).toBe(true);
    });
  });

  describe("getLogsBySeverity()", () => {
    beforeEach(() => {
      useLogStore.getState().addLog(createTestError({ severity: "error" }));
      useLogStore.getState().addLog(createTestError({ severity: "warning" }));
      useLogStore.getState().addLog(createTestError({ severity: "error" }));
      useLogStore.getState().addLog(createTestError({ severity: "info" }));
      useLogStore.getState().addLog(createTestError({ severity: "critical" }));
    });

    it("should filter logs by error severity", () => {
      const errorLogs = useLogStore.getState().getLogsBySeverity("error");
      expect(errorLogs).toHaveLength(2);
      errorLogs.forEach((log) => expect(log.severity).toBe("error"));
    });

    it("should filter logs by warning severity", () => {
      const warningLogs = useLogStore.getState().getLogsBySeverity("warning");
      expect(warningLogs).toHaveLength(1);
    });

    it("should filter logs by critical severity", () => {
      const criticalLogs = useLogStore.getState().getLogsBySeverity("critical");
      expect(criticalLogs).toHaveLength(1);
    });

    it("should return empty array for non-existent severity", () => {
      const debugLogs = useLogStore.getState().getLogsBySeverity("debug");
      expect(debugLogs).toHaveLength(0);
    });
  });

  describe("getLogsByCategory()", () => {
    beforeEach(() => {
      useLogStore.getState().addLog(createTestError({ category: "file_upload" }));
      useLogStore.getState().addLog(createTestError({ category: "network" }));
      useLogStore.getState().addLog(createTestError({ category: "file_upload" }));
      useLogStore.getState().addLog(createTestError({ category: "webgl" }));
    });

    it("should filter logs by category", () => {
      const fileLogs = useLogStore.getState().getLogsByCategory("file_upload");
      expect(fileLogs).toHaveLength(2);
    });

    it("should return empty array for non-existent category", () => {
      const authLogs = useLogStore.getState().getLogsByCategory("auth");
      expect(authLogs).toHaveLength(0);
    });
  });

  describe("getRecentLogs()", () => {
    beforeEach(() => {
      for (let i = 0; i < 10; i++) {
        useLogStore.getState().addLog(createTestError({ message: `Log ${i}` }));
      }
    });

    it("should return specified number of recent logs", () => {
      const recentLogs = useLogStore.getState().getRecentLogs(5);
      expect(recentLogs).toHaveLength(5);
      expect(recentLogs[0].message).toBe("Log 9");
    });

    it("should return all logs if count exceeds total", () => {
      const recentLogs = useLogStore.getState().getRecentLogs(100);
      expect(recentLogs).toHaveLength(10);
    });
  });

  describe("exportLogs()", () => {
    it("should export logs as valid JSON", () => {
      useLogStore.getState().addLog(createTestError({ message: "Test 1" }));
      useLogStore.getState().addLog(createTestError({ message: "Test 2" }));

      const exported = useLogStore.getState().exportLogs();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveProperty("exportDate");
      expect(parsed).toHaveProperty("appVersion");
      expect(parsed).toHaveProperty("totalLogs", 2);
      expect(parsed).toHaveProperty("logs");
      expect(parsed.logs).toHaveLength(2);
    });

    it("should include all required fields in exported logs", () => {
      useLogStore.getState().addLog(
        createTestError({
          message: "Test",
          severity: "error",
          category: "network",
          code: "6001",
          userAction: "Try again",
        })
      );

      const exported = useLogStore.getState().exportLogs();
      const parsed = JSON.parse(exported);
      const log = parsed.logs[0];

      expect(log).toHaveProperty("id");
      expect(log).toHaveProperty("timestamp");
      expect(log).toHaveProperty("severity", "error");
      expect(log).toHaveProperty("category", "network");
      expect(log).toHaveProperty("code", "6001");
      expect(log).toHaveProperty("message", "Test");
      expect(log).toHaveProperty("userAction", "Try again");
    });

    it("should handle empty logs", () => {
      const exported = useLogStore.getState().exportLogs();
      const parsed = JSON.parse(exported);

      expect(parsed.totalLogs).toBe(0);
      expect(parsed.logs).toHaveLength(0);
    });
  });

  describe("exportLogsAsCSV()", () => {
    it("should export logs as valid CSV", () => {
      useLogStore.getState().addLog(
        createTestError({
          message: "Test error",
          severity: "error",
          category: "network",
          code: "6001",
          userAction: "Try again",
        })
      );

      const csv = useLogStore.getState().exportLogsAsCSV();
      const lines = csv.split("\n");

      // Header line
      expect(lines[0]).toBe(
        "timestamp,severity,category,code,message,userAction,recoverable"
      );

      // Data line
      expect(lines[1]).toContain("error");
      expect(lines[1]).toContain("network");
      expect(lines[1]).toContain("6001");
      expect(lines[1]).toContain("Test error");
    });

    it("should escape quotes in CSV", () => {
      useLogStore.getState().addLog(
        createTestError({
          message: 'Error with "quotes"',
        })
      );

      const csv = useLogStore.getState().exportLogsAsCSV();
      expect(csv).toContain('""quotes""');
    });

    it("should handle empty logs", () => {
      const csv = useLogStore.getState().exportLogsAsCSV();
      const lines = csv.split("\n");

      expect(lines).toHaveLength(1); // Just header
      expect(lines[0]).toContain("timestamp");
    });
  });
});

describe("LogStore Security Tests", () => {
  beforeEach(() => {
    useLogStore.getState().clearLogs();
  });

  it("should handle XSS in log messages", () => {
    useLogStore.getState().addLog(
      createTestError({
        message: '<script>alert("xss")</script>',
      })
    );

    const logs = useLogStore.getState().logs;
    expect(logs[0].message).toContain("script");
  });

  it("should handle SQL injection in context", () => {
    useLogStore.getState().addLog(
      createTestError({
        context: { query: "'; DROP TABLE users; --" },
      })
    );

    const logs = useLogStore.getState().logs;
    expect(logs[0].context?.query).toBe("'; DROP TABLE users; --");
  });

  it("should handle very long messages", () => {
    const longMessage = "x".repeat(100000);
    useLogStore.getState().addLog(createTestError({ message: longMessage }));

    const logs = useLogStore.getState().logs;
    expect(logs[0].message.length).toBe(100000);
  });
});

describe("LogStore Performance Tests", () => {
  it("should handle 1000 logs efficiently", () => {
    const startTime = performance.now();

    for (let i = 0; i < 1000; i++) {
      useLogStore.getState().addLog(createTestError({ message: `Log ${i}` }));
    }

    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(1000); // Should complete in <1s
    expect(useLogStore.getState().logs).toHaveLength(1000);
  });

  it("should export 1000 logs efficiently", () => {
    for (let i = 0; i < 1000; i++) {
      useLogStore.getState().addLog(createTestError({ message: `Log ${i}` }));
    }

    const startTime = performance.now();
    const exported = useLogStore.getState().exportLogs();
    const duration = performance.now() - startTime;

    expect(duration).toBeLessThan(500); // Should complete in <500ms
    expect(JSON.parse(exported).logs).toHaveLength(1000);
  });
});

