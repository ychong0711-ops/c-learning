import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quizAttempts } from "@/db/schema";
import { questionById } from "@/data/questions";
import { getLearnerId } from "@/lib/learner";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    questionId?: unknown;
    selectedIndex?: unknown;
  };

  if (typeof body.questionId !== "string") {
    return NextResponse.json({ error: "invalid questionId" }, { status: 400 });
  }
  if (
    typeof body.selectedIndex !== "number" ||
    !Number.isInteger(body.selectedIndex) ||
    body.selectedIndex < 0 ||
    body.selectedIndex > 3
  ) {
    return NextResponse.json({ error: "invalid selectedIndex" }, { status: 400 });
  }

  const q = questionById(body.questionId);
  if (!q) {
    return NextResponse.json({ error: "unknown question" }, { status: 404 });
  }

  const correct = body.selectedIndex === q.answer;

  const learnerId = await getLearnerId();
  if (learnerId) {
    await db.insert(quizAttempts).values({
      learnerId,
      questionId: q.id,
      selectedIndex: body.selectedIndex,
      isCorrect: correct,
    });
  }

  return NextResponse.json({
    correct,
    answerIndex: q.answer,
    explanation: q.explanation,
  });
}
