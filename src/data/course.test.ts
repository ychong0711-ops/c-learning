import { describe, it, expect } from "vitest";
import { 
  TRACKS, 
  LESSONS, 
  orderedLessons,
  lessonsOfTrack,
  type Track,
  type Lesson 
} from "@/data/course";

describe("course data utilities", () => {
  describe("TRACKS", () => {
    it("has exactly 5 tracks", () => {
      expect(TRACKS).toHaveLength(5);
    });

    it("each track has required properties", () => {
      TRACKS.forEach((track) => {
        expect(track).toHaveProperty("id");
        expect(track).toHaveProperty("code");
        expect(track).toHaveProperty("name");
        expect(track).toHaveProperty("subtitle");
        expect(track).toHaveProperty("description");
        expect(track).toHaveProperty("color");
        
        expect(typeof track.id).toBe("string");
        expect(typeof track.code).toBe("string");
        expect(typeof track.name).toBe("string");
        expect(typeof track.subtitle).toBe("string");
        expect(typeof track.description).toBe("string");
        expect(typeof track.color).toBe("string");
        
        expect(track.id.length).toBeGreaterThan(0);
        expect(track.code.length).toBeGreaterThan(0);
        expect(track.name.length).toBeGreaterThan(0);
        expect(track.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("has unique track IDs", () => {
      const ids = TRACKS.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("has unique track codes", () => {
      const codes = TRACKS.map(t => t.code);
      expect(new Set(codes).size).toBe(codes.length);
    });

    it("track IDs match expected values", () => {
      const expectedIds = ["basics", "memory", "bits", "embedded", "automotive"];
      const actualIds = TRACKS.map(t => t.id).sort();
      expect(actualIds).toEqual(expectedIds.sort());
    });

    it("track codes follow TRK-XX pattern", () => {
      TRACKS.forEach((track) => {
        expect(track.code).toMatch(/^TRK-\d{2}$/);
      });
    });
  });

  describe("LESSONS", () => {
    it("has lessons for all tracks", () => {
      const trackIds = new Set(TRACKS.map(t => t.id));
      const lessonTrackIds = new Set(LESSONS.map(l => l.trackId));
      
      trackIds.forEach(id => {
        expect(lessonTrackIds.has(id)).toBe(true);
      });
    });

    it("each lesson has required properties", () => {
      LESSONS.forEach((lesson) => {
        expect(lesson).toHaveProperty("id");
        expect(lesson).toHaveProperty("trackId");
        expect(lesson).toHaveProperty("title");
        expect(lesson).toHaveProperty("minutes");
        expect(lesson).toHaveProperty("level");
        expect(lesson).toHaveProperty("summary");
        expect(lesson).toHaveProperty("sections");
        expect(lesson).toHaveProperty("keyPoints");
        
        expect(typeof lesson.id).toBe("string");
        expect(typeof lesson.trackId).toBe("string");
        expect(typeof lesson.title).toBe("string");
        expect(typeof lesson.minutes).toBe("number");
        expect(["입문", "중급", "심화"]).toContain(lesson.level);
        expect(typeof lesson.summary).toBe("string");
        expect(Array.isArray(lesson.sections)).toBe(true);
        expect(Array.isArray(lesson.keyPoints)).toBe(true);
        
        expect(lesson.id.length).toBeGreaterThan(0);
        expect(lesson.title.length).toBeGreaterThan(0);
        expect(lesson.minutes).toBeGreaterThan(0);
      });
    });

    it("has unique lesson IDs", () => {
      const ids = LESSONS.map(l => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("each lesson references a valid track", () => {
      const trackIds = new Set(TRACKS.map(t => t.id));
      LESSONS.forEach(lesson => {
        expect(trackIds.has(lesson.trackId)).toBe(true);
      });
    });

    it("each lesson has at least one section", () => {
      LESSONS.forEach(lesson => {
        expect(lesson.sections.length).toBeGreaterThan(0);
      });
    });

    it("each section has required properties", () => {
      LESSONS.forEach(lesson => {
        lesson.sections.forEach(section => {
          expect(section).toHaveProperty("heading");
          expect(section).toHaveProperty("body");
          expect(typeof section.heading).toBe("string");
          expect(typeof section.body).toBe("string");
          expect(section.heading.length).toBeGreaterThan(0);
          expect(section.body.length).toBeGreaterThan(0);
          
          if (section.code !== undefined) {
            expect(typeof section.code).toBe("string");
          }
          if (section.caption !== undefined) {
            expect(typeof section.caption).toBe("string");
          }
        });
      });
    });

    it("each lesson has at least one key point", () => {
      LESSONS.forEach(lesson => {
        expect(lesson.keyPoints.length).toBeGreaterThan(0);
        lesson.keyPoints.forEach(point => {
          expect(typeof point).toBe("string");
          expect(point.length).toBeGreaterThan(0);
        });
      });
    });

    it("lesson IDs follow track-lesson pattern", () => {
      LESSONS.forEach(lesson => {
        expect(lesson.id).toMatch(/^[a-z]+-\d{2}$/);
        const trackPrefix = lesson.trackId === "basics" ? "basics" : 
                           lesson.trackId === "memory" ? "memory" :
                           lesson.trackId === "bits" ? "bits" :
                           lesson.trackId === "embedded" ? "embedded" : "automotive";
        expect(lesson.id.startsWith(trackPrefix)).toBe(true);
      });
    });

    it("lesson levels are valid", () => {
      const validLevels = ["입문", "중급", "심화"];
      LESSONS.forEach(lesson => {
        expect(validLevels).toContain(lesson.level);
      });
    });
  });

  describe("orderedLessons", () => {
    it("returns lessons grouped by track in track order", () => {
      const ordered = orderedLessons();
      
      // Should have all lessons
      expect(ordered.length).toBe(LESSONS.length);
      
      // Should be grouped by track
      let currentTrack = "";
      let trackOrder: string[] = [];
      
      ordered.forEach(lesson => {
        if (lesson.trackId !== currentTrack) {
          currentTrack = lesson.trackId;
          trackOrder.push(currentTrack);
        }
      });
      
      // Track order should match TRACKS order
      expect(trackOrder).toEqual(TRACKS.map(t => t.id));
    });

    it("maintains lesson order within each track", () => {
      const ordered = orderedLessons();
      
      TRACKS.forEach(track => {
        const trackLessons = ordered.filter(l => l.trackId === track.id);
        const originalTrackLessons = LESSONS.filter(l => l.trackId === track.id);
        
        expect(trackLessons.map(l => l.id)).toEqual(originalTrackLessons.map(l => l.id));
      });
    });

    it("returns a new array (not the original)", () => {
      const ordered = orderedLessons();
      expect(ordered).not.toBe(LESSONS);
    });
  });

  describe("lessonsOfTrack", () => {
    it("returns lessons for basics track", () => {
      const basicsLessons = lessonsOfTrack("basics");
      
      expect(basicsLessons.length).toBeGreaterThan(0);
      basicsLessons.forEach(l => {
        expect(l.trackId).toBe("basics");
      });
    });

    it("returns lessons for memory track", () => {
      const memoryLessons = lessonsOfTrack("memory");
      expect(memoryLessons.length).toBeGreaterThan(0);
      memoryLessons.forEach(l => expect(l.trackId).toBe("memory"));
    });

    it("returns empty array for non-existent track", () => {
      const result = lessonsOfTrack("nonexistent");
      expect(result).toEqual([]);
    });

    it("returns new array (not reference to original)", () => {
      const result = lessonsOfTrack("basics");
      expect(result).not.toBe(LESSONS);
    });
  });

  describe("data consistency", () => {
    it("all lesson trackIds exist in TRACKS", () => {
      const trackIds = new Set(TRACKS.map(t => t.id));
      LESSONS.forEach(lesson => {
        expect(trackIds.has(lesson.trackId)).toBe(true);
      });
    });

    it("no duplicate lesson IDs across tracks", () => {
      const ids = LESSONS.map(l => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("basics track has 3 lessons", () => {
      const basicsLessons = LESSONS.filter(l => l.trackId === "basics");
      expect(basicsLessons.length).toBe(3);
    });

    it("memory track has 3 lessons", () => {
      const memoryLessons = LESSONS.filter(l => l.trackId === "memory");
      expect(memoryLessons.length).toBe(3);
    });

    it("bits track has 3 lessons", () => {
      const bitsLessons = LESSONS.filter(l => l.trackId === "bits");
      expect(bitsLessons.length).toBe(3);
    });

    it("embedded track has 3 lessons", () => {
      const embeddedLessons = LESSONS.filter(l => l.trackId === "embedded");
      expect(embeddedLessons.length).toBe(3);
    });

    it("automotive track has 3 lessons", () => {
      const automotiveLessons = LESSONS.filter(l => l.trackId === "automotive");
      expect(automotiveLessons.length).toBe(3);
    });

    it("total lessons = 15 (5 tracks × 3 lessons)", () => {
      expect(LESSONS.length).toBe(15);
    });
  });
});