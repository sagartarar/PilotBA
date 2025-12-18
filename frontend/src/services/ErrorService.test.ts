/**
 * ErrorService Tests
 *
 * Comprehensive tests for the centralized error handling system.
 *
 * @author Toaster (Senior QA Engineer)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ErrorService, errorService } from "./ErrorService";
import { PilotBAError, ERROR_CODES, createError } from "./errorCodes";

describe("ErrorService", () => {
  let testService: ErrorService;
  let mockLogStore: { addLog: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Get fresh instance for testing
    testService = ErrorService.getInstance();
    mockLogStore = { addLog: vi.fn() };
    testService.setLogStore(mockLogStore.addLog);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = ErrorService.getInstance();
      const instance2 = ErrorService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("capture()", () => {
    it("should capture Error objects", () => {
      const error = new Error("Test error message");
      const result = testService.capture(error);

      expect(result.message).toBe("Test error message");
      expect(result.severity).toBe("error");
      expect(result.recoverable).toBe(true);
      expect(result.id).toMatch(/^err_/);
    });

    it("should capture string errors", () => {
      const result = testService.capture("Simple string error");

      expect(result.message).toBe("Simple string error");
      expect(result.severity).toBe("error");
      expect(result.code).toBe("UNKNOWN");
    });

    it("should capture PilotBAError objects", () => {
      const pilotError: PilotBAError = {
        id: "test-id",
        timestamp: new Date(),
        severity: "warning",
        category: "file_upload",
        code: "1001",
        message: "Test warning",
        recoverable: true,
      };

      const result = testService.capture(pilotError);

      expect(result.id).toBe("test-id");
      expect(result.severity).toBe("warning");
      expect(result.category).toBe("file_upload");
    });

    it("should merge context when provided", () => {
      const pilotError: PilotBAError = {
        id: "test-id",
        timestamp: new Date(),
        severity: "error",
        category: "file_upload",
        code: "1001",
        message: "Test error",
        context: { fileName: "test.csv" },
        recoverable: true,
      };

      const result = testService.capture(pilotError, { fileSize: 1024 });

      expect(result.context).toEqual({
        fileName: "test.csv",
        fileSize: 1024,
      });
    });

    it("should add to log store", () => {
      testService.capture("Test error");

      expect(mockLogStore.addLog).toHaveBeenCalledTimes(1);
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Test error",
        })
      );
    });
  });

  describe("captureCode()", () => {
    it("should create error from error code", () => {
      const result = testService.captureCode("FILE_TOO_LARGE", {
        fileName: "big.csv",
      });

      expect(result.code).toBe("1001");
      expect(result.message).toBe("File exceeds maximum size");
      expect(result.userAction).toBe("Upload a file smaller than 100MB");
      expect(result.context).toEqual({ fileName: "big.csv" });
    });

    it("should include technical details when provided", () => {
      const result = testService.captureCode(
        "CSV_MALFORMED",
        { row: 42 },
        "Parse error at line 42, column 5"
      );

      expect(result.technicalDetails).toBe("Parse error at line 42, column 5");
    });
  });

  describe("info() and warn()", () => {
    it("should log info messages", () => {
      testService.info("Info message", { key: "value" });

      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: "info",
          message: "Info message",
          context: { key: "value" },
        })
      );
    });

    it("should log warning messages", () => {
      testService.warn("Warning message");

      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: "warning",
          message: "Warning message",
        })
      );
    });
  });

  describe("subscribe()", () => {
    it("should notify subscribers for error severity", () => {
      const callback = vi.fn();
      testService.subscribe(callback);

      testService.capture({
        id: "test",
        timestamp: new Date(),
        severity: "error",
        category: "unknown",
        code: "TEST",
        message: "Test error",
        recoverable: true,
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should notify subscribers for critical severity", () => {
      const callback = vi.fn();
      testService.subscribe(callback);

      testService.capture({
        id: "test",
        timestamp: new Date(),
        severity: "critical",
        category: "memory",
        code: "5001",
        message: "Critical error",
        recoverable: false,
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should NOT notify subscribers for info severity", () => {
      const callback = vi.fn();
      testService.subscribe(callback);

      testService.info("Info message");

      expect(callback).not.toHaveBeenCalled();
    });

    it("should NOT notify subscribers for warning severity", () => {
      const callback = vi.fn();
      testService.subscribe(callback);

      testService.warn("Warning message");

      expect(callback).not.toHaveBeenCalled();
    });

    it("should return unsubscribe function", () => {
      const callback = vi.fn();
      const unsubscribe = testService.subscribe(callback);

      // First capture should notify
      testService.capture("Error 1");
      expect(callback).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();

      // Second capture should NOT notify
      testService.capture("Error 2");
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should handle subscriber errors gracefully", () => {
      const badCallback = vi.fn(() => {
        throw new Error("Subscriber error");
      });
      const goodCallback = vi.fn();

      testService.subscribe(badCallback);
      testService.subscribe(goodCallback);

      // Should not throw
      expect(() => testService.capture("Test error")).not.toThrow();

      // Good callback should still be called
      expect(goodCallback).toHaveBeenCalled();
    });
  });

  describe("Error Category Inference", () => {
    it("should infer network category", () => {
      const result = testService.capture(new Error("Network fetch failed"));
      expect(result.category).toBe("network");
    });

    it("should infer webgl category", () => {
      const result = testService.capture(new Error("WebGL context lost"));
      expect(result.category).toBe("webgl");
    });

    it("should infer memory category", () => {
      const result = testService.capture(new Error("Memory allocation failed"));
      expect(result.category).toBe("memory");
    });

    it("should infer file_parse category", () => {
      const result = testService.capture(new Error("JSON parse error"));
      expect(result.category).toBe("file_parse");
    });

    it("should infer file_upload category", () => {
      const result = testService.capture(new Error("File upload error"));
      expect(result.category).toBe("file_upload");
    });

    it("should default to unknown category", () => {
      const result = testService.capture(new Error("Some random error"));
      expect(result.category).toBe("unknown");
    });
  });
});

describe("errorCodes", () => {
  describe("ERROR_CODES", () => {
    it("should have all required fields for each error code", () => {
      Object.entries(ERROR_CODES).forEach(([key, value]) => {
        expect(value).toHaveProperty("code");
        expect(value).toHaveProperty("message");
        expect(value).toHaveProperty("userAction");
        expect(value).toHaveProperty("severity");
        expect(value).toHaveProperty("recoverable");
      });
    });

    it("should have unique error codes", () => {
      const codes = Object.values(ERROR_CODES).map((e) => e.code);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });

    it("should follow code prefix convention", () => {
      // File errors start with 1
      expect(ERROR_CODES.FILE_TOO_LARGE.code).toMatch(/^1/);
      // Parse errors start with 2
      expect(ERROR_CODES.CSV_MALFORMED.code).toMatch(/^2/);
      // Transform errors start with 3
      expect(ERROR_CODES.COLUMN_NOT_FOUND.code).toMatch(/^3/);
      // WebGL errors start with 4
      expect(ERROR_CODES.WEBGL_NOT_SUPPORTED.code).toMatch(/^4/);
      // Memory errors start with 5
      expect(ERROR_CODES.OUT_OF_MEMORY.code).toMatch(/^5/);
      // Network errors start with 6
      expect(ERROR_CODES.NETWORK_ERROR.code).toMatch(/^6/);
    });
  });

  describe("createError()", () => {
    it("should create error with correct structure", () => {
      const error = createError("FILE_TOO_LARGE");

      expect(error.id).toMatch(/^err_/);
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.severity).toBe("error");
      expect(error.category).toBe("file_upload");
      expect(error.code).toBe("1001");
      expect(error.message).toBe("File exceeds maximum size");
      expect(error.userAction).toBe("Upload a file smaller than 100MB");
      expect(error.recoverable).toBe(true);
    });

    it("should include context when provided", () => {
      const error = createError("FILE_TOO_LARGE", {
        fileName: "test.csv",
        fileSize: 200000000,
      });

      expect(error.context).toEqual({
        fileName: "test.csv",
        fileSize: 200000000,
      });
    });

    it("should include technical details when provided", () => {
      const error = createError(
        "CSV_MALFORMED",
        undefined,
        "Parse error at line 42"
      );

      expect(error.technicalDetails).toBe("Parse error at line 42");
    });
  });
});

describe("Security Tests", () => {
  let testService: ErrorService;

  beforeEach(() => {
    testService = ErrorService.getInstance();
    testService.setLogStore(vi.fn());
  });

  it("should capture XSS content safely (sanitization happens at display)", () => {
    const xssError = new Error('<script>alert("xss")</script>');
    const result = testService.capture(xssError);

    // ErrorService stores the raw message - sanitization happens at display time
    // This is intentional to preserve the original error for debugging
    expect(result.message).toContain("script");
    expect(typeof result.message).toBe("string");
  });

  it("should handle SQL injection in context safely", () => {
    const result = testService.capture("Test error", {
      query: "'; DROP TABLE users; --",
    });

    // Context should be stored as-is (no SQL execution in frontend)
    expect(result.context?.query).toBe("'; DROP TABLE users; --");
  });

  it("should handle prototype pollution attempts", () => {
    const originalProto = Object.prototype.toString;

    testService.capture("Test error", {
      __proto__: { polluted: true },
      constructor: { prototype: { polluted: true } },
    });

    // Prototype should not be polluted
    expect(Object.prototype.toString).toBe(originalProto);
  });

  it("should handle very long error messages", () => {
    const longMessage = "x".repeat(100000);
    const result = testService.capture(new Error(longMessage));

    // Should handle without crashing
    expect(result.message.length).toBe(100000);
  });
});

