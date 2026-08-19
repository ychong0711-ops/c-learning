import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { learners } from "@/db/schema";
import { LEARNER_COOKIE } from "@/lib/learner";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: unknown;
    goal?: unknown;
  };

  const name =
    typeof body.name === "string" && body.name.trim().length > 0
      ? body.name.trim().slice(0, 24)
      : "익명 엔지니어";
  const goal = typeof body.goal === "string" ? body.goal.trim().slice(0, 48) : "";

  const [row] = await db.insert(learners).values({ name, goal }).returning();
  if (!row) {
    return NextResponse.json({ error: "failed to create learner" }, { status: 500 });
  }

  const res = NextResponse.json({ id: row.id, name: row.name });
  res.cookies.set(LEARNER_COOKIE, String(row.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(LEARNER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
