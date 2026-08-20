import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock next/headers cookies - use vi.hoisted for top-level variables
const { mockGet, mockSet, mockCookiesStore } = vi.hoisted(() => {
  const store = new Map<string, { value: string }>();
  return {
    mockCookiesStore: store,
    mockGet: vi.fn((name: string) => store.get(name)),
    mockSet: vi.fn((name: string, value: string) => {
      store.set(name, { value });
    }),
  };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: mockGet, set: mockSet })),
}));

// Mock database
const { mockDbSelect, mockDbFrom, mockDbWhere, mockDbLimit } = vi.hoisted(() => ({
  mockDbSelect: vi.fn().mockReturnThis(),
  mockDbFrom: vi.fn().mockReturnThis(),
  mockDbWhere: vi.fn().mockReturnThis(),
  mockDbLimit: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/db", () => ({
  db: {
    select: mockDbSelect,
    from: mockDbFrom,
    where: mockDbWhere,
    limit: mockDbLimit,
  },
}));

vi.mock("@/db/schema", () => ({
  learners: {
    id: "id",
  },
}));

import { getLearnerId, getLearner, LEARNER_COOKIE } from "@/lib/learner";
import { db } from "@/db";
import { eq } from "drizzle-orm";

describe("learner utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookiesStore.clear();
    mockDbSelect.mockReturnThis();
    mockDbFrom.mockReturnThis();
    mockDbWhere.mockReturnThis();
    mockDbLimit.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getLearnerId", () => {
    it("returns null when cookie is not set", async () => {
      mockGet.mockReturnValue(undefined);

      const result = await getLearnerId();

      expect(result).toBeNull();
      expect(mockGet).toHaveBeenCalledWith(LEARNER_COOKIE);
    });

    it("returns null when cookie value is not a valid integer", async () => {
      mockGet.mockReturnValue({ value: "abc" });

      const result = await getLearnerId();

      expect(result).toBeNull();
    });

    it("returns null when cookie value is zero", async () => {
      mockGet.mockReturnValue({ value: "0" });

      const result = await getLearnerId();

      expect(result).toBeNull();
    });

    it("returns null when cookie value is negative", async () => {
      mockGet.mockReturnValue({ value: "-5" });

      const result = await getLearnerId();

      expect(result).toBeNull();
    });

    it("returns null when cookie value is a float", async () => {
      mockGet.mockReturnValue({ value: "3.14" });

      const result = await getLearnerId();

      expect(result).toBeNull();
    });

    it("returns the learner ID when cookie has a valid positive integer", async () => {
      mockGet.mockReturnValue({ value: "42" });

      const result = await getLearnerId();

      expect(result).toBe(42);
    });

    it("handles whitespace in cookie value", async () => {
      mockGet.mockReturnValue({ value: "  123  " });

      const result = await getLearnerId();

      // Number("  123  ") = 123, which is a valid positive integer
      expect(result).toBe(123);
    });
  });

  describe("getLearner", () => {
    it("returns null when getLearnerId returns null", async () => {
      mockGet.mockReturnValue(undefined);

      const result = await getLearner();

      expect(result).toBeNull();
      expect(db.select).not.toHaveBeenCalled();
    });

    it("returns null when database returns no rows", async () => {
      mockGet.mockReturnValue({ value: "1" });
      mockDbLimit.mockResolvedValue([]);

      const result = await getLearner();

      expect(result).toBeNull();
      expect(db.select).toHaveBeenCalled();
      expect(db.from).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalledWith(expect.anything());
      expect(db.limit).toHaveBeenCalledWith(1);
    });

    it("returns the learner when found in database", async () => {
      const mockLearner = {
        id: 1,
        name: "Test Learner",
        goal: "Learn C",
        createdAt: new Date(),
      };
      mockGet.mockReturnValue({ value: "1" });
      mockDbLimit.mockResolvedValue([mockLearner]);

      const result = await getLearner();

      expect(result).toEqual(mockLearner);
    });

    it("calls database with correct where clause for learner ID", async () => {
      mockGet.mockReturnValue({ value: "5" });
      mockDbLimit.mockResolvedValue([]);

      await getLearner();

      expect(db.where).toHaveBeenCalled();
    });
  });
});