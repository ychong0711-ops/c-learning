import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { learners } from "@/db/schema";

export const LEARNER_COOKIE = "embedc_learner";

export async function getLearnerId(): Promise<number | null> {
  const store = await cookies();
  const raw = store.get(LEARNER_COOKIE)?.value;
  const id = raw ? Number(raw) : Number.NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}

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
