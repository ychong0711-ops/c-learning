import { NextRequest, NextResponse } from "next/server";
import { QUESTIONS } from "@/data/questions";

export async function GET(req: NextRequest) {
  const track = req.nextUrl.searchParams.get("track");
  const lesson = req.nextUrl.searchParams.get("lesson");

  let list = QUESTIONS;
  if (lesson) list = list.filter((q) => q.lessonId === lesson);
  if (track) list = list.filter((q) => q.trackId === track);

  // 정답과 해설은 절대 클라이언트에 보내지 않는다.
  const questions = list.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    code: q.code,
    options: q.options,
  }));

  return NextResponse.json({ questions });
}
