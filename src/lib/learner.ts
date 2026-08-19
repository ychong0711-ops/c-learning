import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { learners } from "@/db/schema";

export const LEARNER_COOKIE = "embedc_learner";

/**
 * 로그인된 학습자의 고유 ID를 쿠키에서 조회합니다.
 * 쿠키에 저장된 ID가 유효한 정수이면 반환하고, 그렇지 않으면 null을 반환합니다.
 * @returns 학습자 ID 번호 또는 null (로그인되지 않은 경우)
 */
export async function getLearnerId(): Promise<number | null> {
  const store = await cookies();
  const raw = store.get(LEARNER_COOKIE)?.value;
  const id = raw ? Number(raw) : Number.NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * 현재 로그인된 학습자의 정보를 데이터베이스에서 조회합니다.
 * 쿠키에 저장된 ID를 이용해 learners 테이블에서 레코드를 찾습니다.
 * 쿠키가 없거나 유효하지 않은 ID인 경우 null을 반환합니다.
 * @returns 학습자 객체 또는 null (로그인되지 않았거나 데이터를 찾을 수 없는 경우)
 */
export async function getLearner() {
  const id = await getLearnerId();
  if (!id) return null;
  const rows = await db
    .select()
    .from(learners)
    .where(eq(learners.id, id))
    .limit(1);
  return rows[0] ?? null;
}
