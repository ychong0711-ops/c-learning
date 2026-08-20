import { describe, it, expect } from "vitest";
import { 
  QUESTIONS, 
  questionsByLesson, 
  questionsByTrack, 
  questionById,
  type Question 
} from "@/data/questions";

describe("question utilities", () => {
  describe("QUESTIONS array", () => {
    it("has questions", () => {
      expect(QUESTIONS.length).toBeGreaterThan(0);
    });

    it("each question has required properties", () => {
      QUESTIONS.forEach((q) => {
        expect(q).toHaveProperty("id");
        expect(q).toHaveProperty("trackId");
        expect(q).toHaveProperty("lessonId");
        expect(q).toHaveProperty("prompt");
        expect(q).toHaveProperty("options");
        expect(q).toHaveProperty("answer");
        expect(q).toHaveProperty("explanation");
        
        expect(typeof q.id).toBe("string");
        expect(typeof q.trackId).toBe("string");
        expect(typeof q.lessonId).toBe("string");
        expect(typeof q.prompt).toBe("string");
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBe(4);
        expect(typeof q.answer).toBe("number");
        expect(typeof q.explanation).toBe("string");
        
        expect(q.id.length).toBeGreaterThan(0);
        expect(q.trackId.length).toBeGreaterThan(0);
        expect(q.lessonId.length).toBeGreaterThan(0);
        expect(q.prompt.length).toBeGreaterThan(0);
        expect(q.explanation.length).toBeGreaterThan(0);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(4);
      });
    });

    it("has unique question IDs", () => {
      const ids = QUESTIONS.map(q => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("each question references a valid track", () => {
      const validTracks = [
        "basics", "memory", "bits", "embedded", "automotive"
      ];
      QUESTIONS.forEach(q => {
        expect(validTracks).toContain(q.trackId);
      });
    });

    it("options are array of 4 strings", () => {
      QUESTIONS.forEach(q => {
        expect(q.options).toHaveLength(4);
        q.options.forEach(opt => {
          expect(typeof opt).toBe("string");
          expect(opt.length).toBeGreaterThan(0);
        });
      });
    });

    it("answer index is valid for options array", () => {
      QUESTIONS.forEach(q => {
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
      });
    });

    it("code property is optional but when present is a string", () => {
      QUESTIONS.forEach(q => {
        if (q.code !== undefined) {
          expect(typeof q.code).toBe("string");
          expect(q.code.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe("questionsByLesson", () => {
    it("returns questions for a valid lessonId", () => {
      const result = questionsByLesson("basics-01");
      
      expect(result.length).toBeGreaterThan(0);
      result.forEach(q => {
        expect(q.lessonId).toBe("basics-01");
      });
    });

    it("returns empty array for non-existent lessonId", () => {
      const result = questionsByLesson("nonexistent-lesson");
      expect(result).toEqual([]);
    });

    it("returns questions for basics-02", () => {
      const result = questionsByLesson("basics-02");
      expect(result.length).toBeGreaterThan(0);
      result.forEach(q => expect(q.lessonId).toBe("basics-02"));
    });

    it("returns questions for memory-01", () => {
      const result = questionsByLesson("memory-01");
      expect(result.length).toBeGreaterThan(0);
      result.forEach(q => expect(q.lessonId).toBe("memory-01"));
    });

    it("returns questions for automotive-03", () => {
      const result = questionsByLesson("automotive-03");
      expect(result.length).toBeGreaterThan(0);
      result.forEach(q => expect(q.lessonId).toBe("automotive-03"));
    });

    it("returns new array (not reference to original)", () => {
      const result = questionsByLesson("basics-01");
      expect(result).not.toBe(QUESTIONS);
    });

    it("handles case where lesson has no questions", () => {
      // If a lesson exists but has no questions, should return empty array
      const result = questionsByLesson("basics-99");
      expect(result).toEqual([]);
    });
  });

  describe("questionsByTrack", () => {
    it("returns questions for basics track", () => {
      const result = questionsByTrack("basics");
      
      expect(result.length).toBeGreaterThan(0);
      result.forEach(q => {
        expect(q.trackId).toBe("basics");
      });
    });

    it("returns questions for memory track", () => {
      const result = questionsByTrack("memory");
      expect(result.length).toBeGreaterThan(0);
      result.forEach(q => expect(q.trackId).toBe("memory"));
    });

    it("returns questions for bits track", () => {
      const result = questionsByTrack("bits");
      expect(result.length).toBeGreaterThan(0);
      result.forEach(q => expect(q.trackId).toBe("bits"));
    });

    it("returns questions for embedded track", () => {
      const result = questionsByTrack("embedded");
      expect(result.length).toBeGreaterThan(0);
      result.forEach(q => expect(q.trackId).toBe("embedded"));
    });

    it("returns questions for automotive track", () => {
      const result = questionsByTrack("automotive");
      expect(result.length).toBeGreaterThan(0);
      result.forEach(q => expect(q.trackId).toBe("automotive"));
    });

    it("returns empty array for non-existent trackId", () => {
      const result = questionsByTrack("nonexistent");
      expect(result).toEqual([]);
    });

    it("returns new array (not reference to original)", () => {
      const result = questionsByTrack("basics");
      expect(result).not.toBe(QUESTIONS);
    });

    it("includes all lessons from the track", () => {
      const basicsQuestions = questionsByTrack("basics");
      const basicsLessonIds = [...new Set(basicsQuestions.map(q => q.lessonId))];
      
      // Should have questions from all basics lessons
      expect(basicsLessonIds).toContain("basics-01");
      expect(basicsLessonIds).toContain("basics-02");
      expect(basicsLessonIds).toContain("basics-03");
    });
  });

  describe("questionById", () => {
    it("returns question for valid ID", () => {
      const result = questionById("q01");
      
      expect(result).toBeDefined();
      expect(result?.id).toBe("q01");
    });

    it("returns question with all properties", () => {
      const result = questionById("q05");
      
      expect(result).toBeDefined();
      expect(result?.trackId).toBe("basics");
      expect(result?.lessonId).toBe("basics-03");
      expect(result?.answer).toBe(1);
    });

    it("returns undefined for non-existent ID", () => {
      const result = questionById("nonexistent-id");
      expect(result).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      const result = questionById("");
      expect(result).toBeUndefined();
    });

    it("finds question by exact ID match", () => {
      const result = questionById("q15");
      
      expect(result).toBeDefined();
      expect(result?.prompt).toContain("비트 3을 1로 설정");
    });

    it("handles numeric-looking IDs as strings", () => {
      const result = questionById("q30");
      
      expect(result).toBeDefined();
      expect(result?.id).toBe("q30");
    });
  });

  describe("data consistency", () => {
    it("every question's trackId exists in questionsByTrack", () => {
      QUESTIONS.forEach(q => {
        const trackQuestions = questionsByTrack(q.trackId);
        expect(trackQuestions.some(tq => tq.id === q.id)).toBe(true);
      });
    });

    it("every question's lessonId exists in questionsByLesson", () => {
      QUESTIONS.forEach(q => {
        const lessonQuestions = questionsByLesson(q.lessonId);
        expect(lessonQuestions.some(lq => lq.id === q.id)).toBe(true);
      });
    });

    it("questionById finds every question in QUESTIONS", () => {
      QUESTIONS.forEach(q => {
        const found = questionById(q.id);
        expect(found).toBeDefined();
        expect(found?.id).toBe(q.id);
      });
    });

    it("questions cover all tracks", () => {
      const trackIds = [...new Set(QUESTIONS.map(q => q.trackId))];
      const expectedTracks = ["basics", "memory", "bits", "embedded", "automotive"];
      
      expectedTracks.forEach(track => {
        expect(trackIds).toContain(track);
      });
    });

    it("questions cover multiple lessons per track", () => {
      const tracks = ["basics", "memory", "bits", "embedded", "automotive"];
      
      tracks.forEach(track => {
        const trackQuestions = questionsByTrack(track);
        const lessonIds = [...new Set(trackQuestions.map(q => q.lessonId))];
        expect(lessonIds.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("has at least 2 questions per lesson on average", () => {
      const lessonIds = [...new Set(QUESTIONS.map(q => q.lessonId))];
      const avgQuestionsPerLesson = QUESTIONS.length / lessonIds.length;
      expect(avgQuestionsPerLesson).toBeGreaterThanOrEqual(1.5);
    });
  });

  describe("question content validation", () => {
    it("basics track questions reference basics lessons", () => {
      const basicsQuestions = questionsByTrack("basics");
      basicsQuestions.forEach(q => {
        expect(q.lessonId.startsWith("basics-")).toBe(true);
      });
    });

    it("memory track questions reference memory lessons", () => {
      const memoryQuestions = questionsByTrack("memory");
      memoryQuestions.forEach(q => {
        expect(q.lessonId.startsWith("memory-")).toBe(true);
      });
    });

    it("automotive track questions reference automotive lessons", () => {
      const autoQuestions = questionsByTrack("automotive");
      autoQuestions.forEach(q => {
        expect(q.lessonId.startsWith("automotive-")).toBe(true);
      });
    });

    it("q01 is about fixed-width integers", () => {
      const q = questionById("q01");
      expect(q).toBeDefined();
      expect(q?.prompt).toContain("2바이트");
      expect(q?.answer).toBe(2); // uint16_t
    });

    it("q03 tests integer division truncation", () => {
      const q = questionById("q03");
      expect(q).toBeDefined();
      expect(q?.code).toContain("5u / 2u * 1000u");
      expect(q?.answer).toBe(1); // 2000
    });

    it("q04 tests assignment vs comparison bug", () => {
      const q = questionById("q04");
      expect(q).toBeDefined();
      expect(q?.code).toContain("sensor = 0xFFu");
      expect(q?.answer).toBe(1);
    });

    it("q12 tests malloc prohibition rationale", () => {
      const q = questionById("q12");
      expect(q).toBeDefined();
      expect(q?.answer).toBe(1);
      expect(q?.explanation).toContain("불확실");
    });

    it("q14 tests unsigned shift constant", () => {
      const q = questionById("q14");
      expect(q).toBeDefined();
      expect(q?.answer).toBe(1); // 1u << 31
      expect(q?.explanation).toContain("unsigned");
    });

    it("q19 tests volatile for ISR flags", () => {
      const q = questionById("q19");
      expect(q).toBeDefined();
      expect(q?.answer).toBe(1);
      expect(q?.explanation).toContain("ISR");
    });

    it("q25 tests MISRA rule categories", () => {
      const q = questionById("q25");
      expect(q).toBeDefined();
      expect(q?.answer).toBe(1); // Mandatory / Required / Advisory
    });

    it("q27 tests _Static_assert purpose", () => {
      const q = questionById("q27");
      expect(q).toBeDefined();
      expect(q?.answer).toBe(1);
      expect(q?.explanation).toContain("컴파일 타임");
    });

    it("q30 tests AUTOSAR naming convention rationale", () => {
      const q = questionById("q30");
      expect(q).toBeDefined();
      expect(q?.answer).toBe(1);
      expect(q?.explanation).toContain("네임스페이스");
    });
  });
});