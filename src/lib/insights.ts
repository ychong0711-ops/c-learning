import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { lessonProgress, practiceProgress, quizAttempts } from "@/db/schema";
import { TRACKS, LESSONS } from "@/data/course";
import { questionById } from "@/data/questions";
import { PRACTICES, PRACTICE_TOPICS } from "@/data/practice";

/**
 * 취약 주제 분석 결과
 */
export type WeakTrack = {
  trackId: string;
  trackName: string;
  trackCode: string;
  color: string;
  /** 해당 트랙 퀴즈 총 시도 수 */
  attempts: number;
  /** 해당 트랙 정답 수 */
  correct: number;
  /** 정답률 (0~100) */
  accuracy: number;
  /** 추천 강의 (미완료 강의 중 첫 2개) */
  recommendedLessons: { id: string; title: string; minutes: number }[];
};

/**
 * 학습자별 트랙 정답률을 분석해 취약 주제(정답률 70% 미만)를 반환합니다.
 * 시도 횟수가 0인 트랙은 제외합니다.
 */
export async function getWeakTracks(learnerId: number): Promise<WeakTrack[]> {
  const attempts = await db
    .select({
      questionId: quizAttempts.questionId,
      isCorrect: quizAttempts.isCorrect,
    })
    .from(quizAttempts)
    .where(eq(quizAttempts.learnerId, learnerId));

  const completedRows = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.learnerId, learnerId), eq(lessonProgress.completed, true)));
  const completedIds = new Set(completedRows.map((r) => r.lessonId));

  // 트랙별 집계
  const byTrack = new Map<
    string,
    { attempts: number; correct: number }
  >();

  for (const a of attempts) {
    const q = questionById(a.questionId);
    if (!q) continue;
    const cur = byTrack.get(q.trackId) ?? { attempts: 0, correct: 0 };
    cur.attempts += 1;
    if (a.isCorrect) cur.correct += 1;
    byTrack.set(q.trackId, cur);
  }

  const weak: WeakTrack[] = [];

  for (const track of TRACKS) {
    const stat = byTrack.get(track.id);
    if (!stat || stat.attempts === 0) continue;

    const accuracy = Math.round((stat.correct / stat.attempts) * 100);
    if (accuracy >= 70) continue; // 취약 주제만 추출

    const trackLessons = LESSONS.filter((l) => l.trackId === track.id);
    const recommendedLessons = trackLessons
      .filter((l) => !completedIds.has(l.id))
      .slice(0, 2)
      .map((l) => ({ id: l.id, title: l.title, minutes: l.minutes }));

    weak.push({
      trackId: track.id,
      trackName: track.name,
      trackCode: track.code,
      color: track.color,
      attempts: stat.attempts,
      correct: stat.correct,
      accuracy,
      recommendedLessons,
    });
  }

  // 정답률 낮은 순 정렬
  return weak.sort((a, b) => a.accuracy - b.accuracy);
}

/**
 * 마지막 학습 활동(퀴즈 풀이 또는 강의 완료) 시간을 반환합니다.
 * 활동이 없으면 null을 반환합니다.
 */
export async function getLastActivity(learnerId: number): Promise<Date | null> {
  const [lastQuiz, lastLesson] = await Promise.all([
    db
      .select({ at: quizAttempts.createdAt })
      .from(quizAttempts)
      .where(eq(quizAttempts.learnerId, learnerId))
      .orderBy(desc(quizAttempts.createdAt))
      .limit(1),
    db
      .select({ at: lessonProgress.updatedAt })
      .from(lessonProgress)
      .where(eq(lessonProgress.learnerId, learnerId))
      .orderBy(desc(lessonProgress.updatedAt))
      .limit(1),
  ]);

  const candidates = [lastQuiz[0]?.at, lastLesson[0]?.at].filter(
    (d): d is Date => d instanceof Date
  );
  if (candidates.length === 0) return null;
  return new Date(Math.max(...candidates.map((d) => d.getTime())));
}

/**
 * 경과 시간을 사람이 읽기 쉬운 문자열로 변환합니다.
 * 예: "3일 전", "5시간 전", "방금 전"
 */
export function formatElapsed(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "방금 전";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;

  const months = Math.floor(days / 30);
  return `${months}개월 전`;
}

/**
 * 학습 리마인더 메시지를 생성합니다.
 * - 3일 이상 활동 없음: 복습 권장 메시지
 * - 1~2일: 가벼운 독려 메시지
 * - 오늘 활동: 칭찬 메시지
 */
export function buildReminder(lastActivity: Date | null): {
  tone: "good" | "warn" | "alert";
  message: string;
} {
  if (!lastActivity) {
    return {
      tone: "warn",
      message: "아직 학습 기록이 없습니다. 첫 강의를 시작해 보세요!",
    };
  }

  const now = new Date();
  const diffMs = now.getTime() - lastActivity.getTime();
  const days = Math.floor(diffMs / 86_400_000);

  if (days >= 3) {
    return {
      tone: "alert",
      message: `${days}일째 학습이 없습니다. 취약 주제 복습으로 다시 시작해 보세요.`,
    };
  }
  if (days >= 1) {
    return {
      tone: "warn",
      message: `어제 학습했네요. 오늘도 10분만 이어가면 습관이 됩니다.`,
    };
  }
  return {
    tone: "good",
    message: "오늘도 학습 중이네요. 꾸준함이 실력입니다!",
  };
}

/**
 * 학습자의 실습 통계를 반환합니다.
 */
export async function getPracticeStats(learnerId: number): Promise<{
  completed: number;
  total: number;
  byTopic: Record<string, number>;
}> {
  const completedRows = await db
    .select({ practiceId: practiceProgress.practiceId })
    .from(practiceProgress)
    .where(and(eq(practiceProgress.learnerId, learnerId), eq(practiceProgress.completed, true)));

  const completedIds = new Set(completedRows.map((r) => r.practiceId));
  const byTopic: Record<string, number> = {};

  // 초기화
  for (const topic of PRACTICE_TOPICS) {
    byTopic[topic] = 0;
  }

  // 집계
  for (const practice of PRACTICES) {
    if (completedIds.has(practice.id)) {
      byTopic[practice.topic] = (byTopic[practice.topic] || 0) + 1;
    }
  }

  return {
    completed: completedIds.size,
    total: PRACTICES.length,
    byTopic,
  };
}

/** 리마인더 톤별 색상 변수 */
export const REMINDER_COLOR: Record<"good" | "warn" | "alert", string> = {
  good: "var(--color-pine)",
  warn: "var(--color-signal)",
  alert: "var(--color-alarm)",
};

/** 취약 주제 없음 여부 확인용 상수 */
export const WEAK_THRESHOLD = 70;