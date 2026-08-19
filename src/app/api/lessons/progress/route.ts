import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lessonProgress } from "@/db/schema";
import { lessonById } from "@/data/course";
import { getLearnerId } from "@/lib/learner";

export async function POST(req: NextRequest) {
  const learnerId = await getLearnerId();
  if (!learnerId) {
    return NextResponse.json({ error: "no profile" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    lessonId?: unknown;
    completed?: unknown;
  };

  if (typeof body.lessonId !== "string" || !lessonById(body.lessonId)) {
    return NextResponse.json({ error: "invalid lessonId" }, { status: 400 });
  }
  if (typeof body.completed !== "boolean") {
    return NextResponse.json({ error: "invalid completed" }, { status: 400 });
  }

  await db
    .insert(lessonProgress)
    .values({ learnerId, lessonId: body.lessonId, completed: body.completed })
    .onConflictDoUpdate({
      target: [lessonProgress.learnerId, lessonProgress.lessonId],
      set: { completed: body.completed, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true, lessonId: body.lessonId, completed: body.completed });
}
