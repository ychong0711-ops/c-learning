import { NextRequest, NextResponse } from "next/server";
import { compileAndRun } from "@/lib/crunner";
import { EXAMPLES } from "@/data/examples";
import { PRACTICES } from "@/data/practice";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    code?: unknown;
    stdin?: unknown;
    std?: unknown;
    opt?: unknown;
    wallExtra?: unknown;
    werror?: unknown;
    exampleId?: unknown;
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

  // If exampleId provided, attach expectedOutput from the example/practice
  let expectedOutput: string | undefined;
  if (typeof body.exampleId === "string") {
    const ex = EXAMPLES.find((e) => e.id === body.exampleId);
    if (ex?.expectedOutput) expectedOutput = ex.expectedOutput;
    else {
      const p = PRACTICES.find((p) => p.id === body.exampleId);
      if (p?.expectedOutput) expectedOutput = p.expectedOutput;
    }
  }

  return NextResponse.json({ ...result, expectedOutput });
}
