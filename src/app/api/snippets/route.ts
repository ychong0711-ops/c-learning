import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { snippets } from "@/db/schema";
import { getLearnerId } from "@/lib/learner";

const MAX_NAME = 40;
const MAX_CODE = 64_000;

export async function GET() {
  const learnerId = await getLearnerId();
  if (!learnerId) return NextResponse.json({ snippets: [] });

  const rows = await db
    .select()
    .from(snippets)
    .where(eq(snippets.learnerId, learnerId))
    .orderBy(desc(snippets.updatedAt))
    .limit(50);

  return NextResponse.json({ snippets: rows });
}

export async function POST(req: NextRequest) {
  const learnerId = await getLearnerId();
  if (!learnerId) {
    return NextResponse.json({ error: "no profile" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    id?: unknown;
    name?: unknown;
    code?: unknown;
    stdin?: unknown;
  };

  const code = typeof body.code === "string" ? body.code.slice(0, MAX_CODE) : null;
  const stdin = typeof body.stdin === "string" ? body.stdin.slice(0, 8_000) : "";
  const name =
    typeof body.name === "string" && body.name.trim().length > 0
      ? body.name.trim().slice(0, MAX_NAME)
      : "이름 없는 스니펫";

  if (code === null) {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }

  // id가 있으면 소유권 확인 후 갱신
  if (typeof body.id === "number") {
    const existing = await db
      .select()
      .from(snippets)
      .where(eq(snippets.id, body.id))
      .limit(1);
    const row = existing[0];
    if (!row || row.learnerId !== learnerId) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    const [updated] = await db
      .update(snippets)
      .set({ name, code, stdin, updatedAt: new Date() })
      .where(eq(snippets.id, row.id))
      .returning();
    return NextResponse.json({ snippet: updated });
  }

  const count = await db
    .select({ id: snippets.id })
    .from(snippets)
    .where(eq(snippets.learnerId, learnerId));
  if (count.length >= 30) {
    return NextResponse.json({ error: "저장 한도(30개)를 넘었습니다." }, { status: 400 });
  }

  const [created] = await db
    .insert(snippets)
    .values({ learnerId, name, code, stdin })
    .returning();
  return NextResponse.json({ snippet: created });
}

export async function DELETE(req: NextRequest) {
  const learnerId = await getLearnerId();
  if (!learnerId) {
    return NextResponse.json({ error: "no profile" }, { status: 401 });
  }

  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(snippets)
    .where(eq(snippets.id, id))
    .limit(1);
  const row = existing[0];
  if (!row || row.learnerId !== learnerId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await db.delete(snippets).where(eq(snippets.id, id));
  return NextResponse.json({ ok: true });
}
