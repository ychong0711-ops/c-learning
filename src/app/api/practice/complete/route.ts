import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { practiceProgress } from "@/db/schema";
import { getLearnerId } from "@/lib/learner";

export async function POST(req: NextRequest) {
  const learnerId = await getLearnerId();
  if (!learnerId) {
    return NextResponse.json({ error: "no profile" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    practiceId?: unknown;
  };

  if (typeof body.practiceId !== "string") {
    return NextResponse.json({ error: "invalid practiceId" }, { status: 400 });
  }

  await db
    .insert(practiceProgress)
    .values({
      learnerId,
      practiceId: body.practiceId,
      completed: true,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [practiceProgress.learnerId, practiceProgress.practiceId],
      set: { completed: true, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true, completed: true });
}
