import { spawn } from "child_process";
import { mkdtemp, rm, writeFile, chmod } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

export type RunRequest = {
  code: string;
  stdin?: string;
  std?: string;
  opt?: string;
  wallExtra?: boolean;
  werror?: boolean;
};

export type RunResult = {
  ok: boolean;
  stage: "compile" | "run";
  exitCode: number | null;
  timedOut: boolean;
  diagnostics: string;
  stdout: string;
  stderr: string;
  timeMs: number;
  errors: number;
  warnings: number;
  compileCommand: string;
};

const MAX_CODE = 64_000;
const MAX_STDIN = 16_000;
const MAX_OUTPUT = 48_000;
const COMPILE_TIMEOUT = 20_000;
const RUN_TIMEOUT = 6_000;

const ALLOWED_STD = new Set(["c99", "c11", "c17", "gnu11", "gnu17"]);
const ALLOWED_OPT = new Set(["-O0", "-O1", "-O2", "-Os"]);

function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + `\n…[출력이 ${max}자를 초과해 잘렸습니다]`;
}

function countLines(text: string, marker: string): number {
  if (!text) return 0;
  return text.split("\n").filter((l) => l.includes(marker)).length;
}

function runCommand(
  cmd: string,
  args: string[],
  opts: { timeout: number; cwd?: string; input?: string }
): Promise<{ code: number | null; stdout: string; stderr: string; timedOut: boolean }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, opts.timeout);

    child.stdout.on("data", (d: Buffer) => {
      stdoutBytes += d.length;
      if (stdoutBytes <= MAX_OUTPUT * 2) stdout += d.toString();
    });
    child.stderr.on("data", (d: Buffer) => {
      stderrBytes += d.length;
      if (stderrBytes <= MAX_OUTPUT * 2) stderr += d.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ code: null, stdout, stderr: stderr + "\n" + String(err), timedOut });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout: clip(stdout, MAX_OUTPUT), stderr: clip(stderr, MAX_OUTPUT), timedOut });
    });

    if (opts.input !== undefined && opts.input.length > 0) {
      child.stdin.write(opts.input);
    }
    child.stdin.end();
  });
}

export async function compileAndRun(req: RunRequest): Promise<RunResult> {
  const code = typeof req.code === "string" ? req.code : "";
  if (code.length === 0) {
    return {
      ok: false,
      stage: "compile",
      exitCode: null,
      timedOut: false,
      diagnostics: "코드가 비어 있습니다.",
      stdout: "",
      stderr: "",
      timeMs: 0,
      errors: 1,
      warnings: 0,
      compileCommand: "",
    };
  }
  if (code.length > MAX_CODE) {
    return {
      ok: false,
      stage: "compile",
      exitCode: null,
      timedOut: false,
      diagnostics: `코드가 너무 깁니다 (최대 ${MAX_CODE}자).`,
      stdout: "",
      stderr: "",
      timeMs: 0,
      errors: 1,
      warnings: 0,
      compileCommand: "",
    };
  }

  const std = ALLOWED_STD.has(req.std ?? "") ? (req.std as string) : "c11";
  const opt = ALLOWED_OPT.has(req.opt ?? "") ? (req.opt as string) : "-O0";
  const stdin = typeof req.stdin === "string" ? req.stdin.slice(0, MAX_STDIN) : "";

  const dir = await mkdtemp(path.join(tmpdir(), "embedc-"));
  const src = path.join(dir, "main.c");
  const bin = path.join(dir, "app.out");

  try {
    await writeFile(src, code, "utf8");

    const flags = [`-std=${std}`, opt, "-Wall", "-Wextra"];
    if (req.werror) flags.push("-Werror");
    const compileCommand = `gcc ${flags.join(" ")} main.c -o app.out -lm`;

    const compile = await runCommand(
      "gcc",
      [...flags, "main.c", "-o", "app.out", "-lm"],
      { timeout: COMPILE_TIMEOUT, cwd: dir }
    );

    if (compile.timedOut) {
      return {
        ok: false,
        stage: "compile",
        exitCode: null,
        timedOut: true,
        diagnostics: "컴파일이 시간 제한을 초과했습니다.",
        stdout: "",
        stderr: "",
        timeMs: COMPILE_TIMEOUT,
        errors: 1,
        warnings: 0,
        compileCommand,
      };
    }

    const errors = countLines(compile.stderr, "error:");
    const warnings = countLines(compile.stderr, "warning:");

    if (compile.code !== 0) {
      return {
        ok: false,
        stage: "compile",
        exitCode: compile.code,
        timedOut: false,
        diagnostics: compile.stderr,
        stdout: compile.stdout,
        stderr: "",
        timeMs: 0,
        errors: Math.max(errors, 1),
        warnings,
        compileCommand,
      };
    }

    await chmod(bin, 0o755);

    // 리소스 제한: 가상 메모리 256MB, CPU 4초, 실행은 bash -c의 ulimit으로 감싼다.
    const started = Date.now();
    const run = await runCommand(
      "bash",
      ["-c", "ulimit -v 262144; ulimit -t 4; ulimit -f 1024; exec ./app.out"],
      { timeout: RUN_TIMEOUT, cwd: dir, input: stdin }
    );
    const timeMs = Date.now() - started;

    let stderr = run.stderr;
    let timedOut = run.timedOut;
    if (run.timedOut) {
      stderr += "\n[시간 초과] 실행이 6초를 넘겨 강제 종료했습니다 (무한 루프 확인).";
    } else if (run.code === null) {
      // 시그널에 의한 강제 종료 — CPU 시간(4초) 또는 메모리(256MB) 제한
      timedOut = true;
      stderr +=
        "\n[강제 종료] 프로세스가 시그널에 의해 종료되었습니다. " +
        "CPU 시간 제한(4초, 무한 루프) 또는 메모리 제한(256MB)이 원인일 수 있습니다.";
    }

    return {
      ok: run.code === 0 && !timedOut,
      stage: "run",
      exitCode: run.code,
      timedOut,
      diagnostics: compile.stderr,
      stdout: run.stdout,
      stderr,
      timeMs,
      errors,
      warnings,
      compileCommand,
    };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
