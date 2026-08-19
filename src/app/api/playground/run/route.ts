import { NextRequest, NextResponse } from "next/server";
import { compileAndRun } from "@/lib/crunner";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    code?: unknown;
    stdin?: unknown;
    std?: unknown;
    opt?: unknown;
    wallExtra?: unknown;
    werror?: unknown;
  };

  if (typeof body.code !== "string") {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }

  const result = await compileAndRun({
    code: body.code,
    stdin: typeof body.stdin === "string" ? body.stdin : "",
    std: typeof body.std === "string" ? body.std : undefined,
    opt: typeof body.opt === "string" ? body.opt : undefined,
    wallExtra: true,
    werror: body.werror === true,
  });

  return NextResponse.json(result);
}
