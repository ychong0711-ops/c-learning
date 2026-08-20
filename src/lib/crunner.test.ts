import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock child_process.spawn - use vi.hoisted for top-level variables
const { mockSpawn, mockChild } = vi.hoisted(() => {
  const child = {
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn(),
    stdin: { write: vi.fn(), end: vi.fn() },
    kill: vi.fn(),
  };
  return {
    mockChild: child,
    mockSpawn: vi.fn(() => child),
  };
});

vi.mock("child_process", () => ({
  spawn: mockSpawn,
  default: { spawn: mockSpawn },
}));

// Mock fs/promises
const { mockMkdtemp, mockRm, mockWriteFile, mockChmod } = vi.hoisted(() => ({
  mockMkdtemp: vi.fn(),
  mockRm: vi.fn(),
  mockWriteFile: vi.fn(),
  mockChmod: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  mkdtemp: mockMkdtemp,
  rm: mockRm,
  writeFile: mockWriteFile,
  chmod: mockChmod,
  default: {
    mkdtemp: mockMkdtemp,
    rm: mockRm,
    writeFile: mockWriteFile,
    chmod: mockChmod,
  },
}));

// Mock os.tmpdir
const { mockTmpdir } = vi.hoisted(() => ({
  mockTmpdir: vi.fn(),
}));

vi.mock("os", () => ({
  tmpdir: mockTmpdir,
  default: { tmpdir: mockTmpdir },
}));

// Mock path.join
const { mockPathJoin } = vi.hoisted(() => ({
  mockPathJoin: vi.fn((...args: string[]) => args.join("/")),
}));

vi.mock("path", () => ({
  join: mockPathJoin,
  default: { join: mockPathJoin },
}));

import { compileAndRun, RunRequest } from "@/lib/crunner";

describe("crunner - compileAndRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock child process
    mockChild.stdout.on.mockReset();
    mockChild.stderr.on.mockReset();
    mockChild.on.mockReset();
    mockChild.stdin.write.mockReset();
    mockChild.stdin.end.mockReset();
    mockChild.kill.mockReset();

    mockSpawn.mockImplementation(() => mockChild);
    mockTmpdir.mockReturnValue("/tmp");
    mockMkdtemp.mockResolvedValue("/tmp/embedc-test123");
    mockWriteFile.mockResolvedValue(undefined);
    mockChmod.mockResolvedValue(undefined);
    mockRm.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  function setupChildProcessEvents(
    stdoutData: string = "",
    stderrData: string = "",
    exitCode: number | null = 0,
    timedOut: boolean = false,
    error?: Error
  ) {
    // Simulate the child process events
    let stdoutHandler: (data: Buffer) => void;
    let stderrHandler: (data: Buffer) => void;
    let closeHandler: (code: number | null) => void;
    let errorHandler: (err: Error) => void;

    mockChild.stdout.on.mockImplementation((event: string, handler: any) => {
      if (event === "data") stdoutHandler = handler;
    });

    mockChild.stderr.on.mockImplementation((event: string, handler: any) => {
      if (event === "data") stderrHandler = handler;
    });

    mockChild.on.mockImplementation((event: string, handler: any) => {
      if (event === "close") closeHandler = handler;
      if (event === "error") errorHandler = handler;
    });

    // Return a function to trigger the events
    return () => {
      if (stdoutData && stdoutHandler) {
        stdoutHandler(Buffer.from(stdoutData));
      }
      if (stderrData && stderrHandler) {
        stderrHandler(Buffer.from(stderrData));
      }
      if (closeHandler) {
        closeHandler(exitCode);
      }
      if (error && errorHandler) {
        errorHandler(error);
      }
    };
  }

  describe("input validation", () => {
    it("returns error for empty code", async () => {
      const req: RunRequest = { code: "" };
      const result = await compileAndRun(req);

      expect(result.ok).toBe(false);
      expect(result.stage).toBe("compile");
      expect(result.diagnostics).toBe("코드가 비어 있습니다.");
      expect(result.errors).toBe(1);
      expect(mockSpawn).not.toHaveBeenCalled();
    });

    it("returns error for code exceeding MAX_CODE", async () => {
      const req: RunRequest = { code: "a".repeat(64001) };
      const result = await compileAndRun(req);

      expect(result.ok).toBe(false);
      expect(result.stage).toBe("compile");
      expect(result.diagnostics).toContain("코드가 너무 깁니다");
      expect(result.errors).toBe(1);
      expect(mockSpawn).not.toHaveBeenCalled();
    });
  });

  describe("compilation stage", () => {
    it("returns compile error when gcc fails", async () => {
      const req: RunRequest = { code: "int main() { return 0; }" };
      
      // First spawn: compile (fails)
      let compileTrigger: () => void;
      mockSpawn.mockImplementationOnce(() => {
        compileTrigger = setupChildProcessEvents(
          "",
          "main.c:1:1: error: expected ';' before '}' token",
          1
        );
        return mockChild;
      });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      const result = await resultPromise;

      expect(result.ok).toBe(false);
      expect(result.stage).toBe("compile");
      expect(result.exitCode).toBe(1);
      expect(result.diagnostics).toContain("error:");
      expect(result.errors).toBeGreaterThanOrEqual(1);
      expect(mockRm).toHaveBeenCalled(); // cleanup
    });

    it("returns compile timeout when compilation exceeds COMPILE_TIMEOUT", async () => {
      const req: RunRequest = { code: "int main() { while(1); }" };
      
      let compileTrigger: () => void;
      mockSpawn.mockImplementationOnce(() => {
        compileTrigger = setupChildProcessEvents("", "", null, true);
        return mockChild;
      });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      const result = await resultPromise;

      expect(result.ok).toBe(false);
      expect(result.stage).toBe("compile");
      expect(result.timedOut).toBe(true);
      expect(result.diagnostics).toContain("컴파일이 시간 제한을 초과했습니다");
      expect(result.timeMs).toBe(20000); // COMPILE_TIMEOUT
      expect(mockRm).toHaveBeenCalled();
    });

    it("counts errors and warnings from stderr", async () => {
      const req: RunRequest = { code: "int main() { return 0; }" };
      
      let compileTrigger: () => void;
      mockSpawn.mockImplementationOnce(() => {
        compileTrigger = setupChildProcessEvents(
          "",
          "main.c:1:1: warning: implicit declaration\nmain.c:2:1: error: expected ';'\nmain.c:3:1: warning: unused variable",
          1
        );
        return mockChild;
      });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      const result = await resultPromise;

      expect(result.errors).toBe(1);
      expect(result.warnings).toBe(2);
    });
  });

  describe("execution stage", () => {
    it("runs the compiled binary and returns stdout", async () => {
      const req: RunRequest = { code: "int main() { return 0; }" };
      
      let compileTrigger: () => void;
      let runTrigger: () => void;
      
      mockSpawn
        .mockImplementationOnce(() => {
          compileTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        })
        .mockImplementationOnce(() => {
          runTrigger = setupChildProcessEvents("Hello, World!\n", "", 0);
          return mockChild;
        });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      runTrigger!();
      const result = await resultPromise;

      expect(result.ok).toBe(true);
      expect(result.stage).toBe("run");
      expect(result.stdout).toBe("Hello, World!\n");
      expect(result.exitCode).toBe(0);
      expect(result.timedOut).toBe(false);
    });

    it("returns runtime error when program exits with non-zero code", async () => {
      const req: RunRequest = { code: "int main() { return 1; }" };
      
      let compileTrigger: () => void;
      let runTrigger: () => void;
      
      mockSpawn
        .mockImplementationOnce(() => {
          compileTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        })
        .mockImplementationOnce(() => {
          runTrigger = setupChildProcessEvents("", "Segmentation fault", 139);
          return mockChild;
        });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      runTrigger!();
      const result = await resultPromise;

      expect(result.ok).toBe(false);
      expect(result.stage).toBe("run");
      expect(result.exitCode).toBe(139);
      expect(result.stderr).toContain("Segmentation fault");
    });

    it("handles runtime timeout", async () => {
      const req: RunRequest = { code: "int main() { while(1); }" };
      
      let compileTrigger: () => void;
      let runTrigger: () => void;
      
      mockSpawn
        .mockImplementationOnce(() => {
          compileTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        })
        .mockImplementationOnce(() => {
          runTrigger = setupChildProcessEvents("", "", null, true);
          return mockChild;
        });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      runTrigger!();
      const result = await resultPromise;

      expect(result.ok).toBe(false);
      expect(result.stage).toBe("run");
      expect(result.timedOut).toBe(true);
      expect(result.stderr).toContain("시간 초과");
      expect(result.timeMs).toBeLessThanOrEqual(6000); // RUN_TIMEOUT
    });

    it("handles process killed by signal (memory/CPU limit)", async () => {
      const req: RunRequest = { code: "int main() { char* p = malloc(1000000000); }" };
      
      let compileTrigger: () => void;
      let runTrigger: () => void;
      
      mockSpawn
        .mockImplementationOnce(() => {
          compileTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        })
        .mockImplementationOnce(() => {
          runTrigger = setupChildProcessEvents("", "", null, false); // code = null means signal
          return mockChild;
        });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      runTrigger!();
      const result = await resultPromise;

      expect(result.ok).toBe(false);
      expect(result.timedOut).toBe(true);
      expect(result.stderr).toContain("강제 종료");
    });

    it("passes stdin to the program", async () => {
      const req: RunRequest = { 
        code: "int main() { char c; read(0, &c, 1); return 0; }",
        stdin: "test input"
      };
      
      let compileTrigger: () => void;
      let runTrigger: () => void;
      
      mockSpawn
        .mockImplementationOnce(() => {
          compileTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        })
        .mockImplementationOnce(() => {
          runTrigger = setupChildProcessEvents("output", "", 0);
          return mockChild;
        });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      runTrigger!();
      await resultPromise;

      // Verify stdin was written
      expect(mockChild.stdin.write).toHaveBeenCalledWith("test input");
      expect(mockChild.stdin.end).toHaveBeenCalled();
    });

    it("truncates stdin to MAX_STDIN", async () => {
      const req: RunRequest = { 
        code: "int main() { return 0; }",
        stdin: "a".repeat(20000)
      };
      
      let compileTrigger: () => void;
      let runTrigger: () => void;
      
      mockSpawn
        .mockImplementationOnce(() => {
          compileTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        })
        .mockImplementationOnce(() => {
          runTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      runTrigger!();
      await resultPromise;

      // Should only write first 16000 chars
      expect(mockChild.stdin.write).toHaveBeenCalledWith("a".repeat(16000));
    });
  });

  describe("werror flag", () => {
    it("adds -Werror flag when werror is true", async () => {
      const req: RunRequest = { 
        code: "int main() { int x; return 0; }",
        werror: true
      };
      
      let compileTrigger: () => void;
      
      mockSpawn.mockImplementationOnce(() => {
        compileTrigger = setupChildProcessEvents(
          "",
          "main.c:1:1: warning: unused variable 'x' [-Wunused-variable]",
          1 // -Werror makes warnings into errors
        );
        return mockChild;
      });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      const result = await resultPromise;

      expect(result.ok).toBe(false);
      expect(result.stage).toBe("compile");
      // With -Werror, the warning becomes an error
      expect(result.errors).toBeGreaterThanOrEqual(1);
    });
  });

  describe("output clipping", () => {
    it("clips stdout exceeding MAX_OUTPUT", async () => {
      const req: RunRequest = { code: "int main() { return 0; }" };
      
      const longOutput = "x".repeat(50000);
      
      let compileTrigger: () => void;
      let runTrigger: () => void;
      
      mockSpawn
        .mockImplementationOnce(() => {
          compileTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        })
        .mockImplementationOnce(() => {
          runTrigger = setupChildProcessEvents(longOutput, "", 0);
          return mockChild;
        });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      runTrigger!();
      const result = await resultPromise;

      expect(result.stdout.length).toBeLessThanOrEqual(48000 + 50); // MAX_OUTPUT + truncation message
      expect(result.stdout).toContain("출력이 48000자를 초과해 잘렸습니다");
    });

    it("clips stderr exceeding MAX_OUTPUT", async () => {
      const req: RunRequest = { code: "int main() { return 0; }" };
      
      const longError = "error ".repeat(10000);
      
      let compileTrigger: () => void;
      let runTrigger: () => void;
      
      mockSpawn
        .mockImplementationOnce(() => {
          compileTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        })
        .mockImplementationOnce(() => {
          runTrigger = setupChildProcessEvents("", longError, 1);
          return mockChild;
        });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      runTrigger!();
      const result = await resultPromise;

      expect(result.stderr.length).toBeLessThanOrEqual(48000 + 50);
      expect(result.stderr).toContain("출력이 48000자를 초과해 잘렸습니다");
    });
  });

  describe("compileCommand in result", () => {
    it("includes the compile command in result", async () => {
      const req: RunRequest = { 
        code: "int main() { return 0; }",
        std: "c11",
        opt: "-O2"
      };
      
      let compileTrigger: () => void;
      let runTrigger: () => void;
      
      mockSpawn
        .mockImplementationOnce(() => {
          compileTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        })
        .mockImplementationOnce(() => {
          runTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      runTrigger!();
      const result = await resultPromise;

      expect(result.compileCommand).toContain("gcc");
      expect(result.compileCommand).toContain("-std=c11");
      expect(result.compileCommand).toContain("-O2");
      expect(result.compileCommand).toContain("-Wall");
      expect(result.compileCommand).toContain("-Wextra");
    });
  });

  describe("cleanup", () => {
    it("cleans up temp directory on success", async () => {
      const req: RunRequest = { code: "int main() { return 0; }" };
      
      let compileTrigger: () => void;
      let runTrigger: () => void;
      
      mockSpawn
        .mockImplementationOnce(() => {
          compileTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        })
        .mockImplementationOnce(() => {
          runTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      runTrigger!();
      await resultPromise;

      expect(mockRm).toHaveBeenCalledWith("/tmp/embedc-test123", { 
        recursive: true, 
        force: true 
      });
    });

    it("cleans up temp directory on compile failure", async () => {
      const req: RunRequest = { code: "int main() { return 0; }" };
      
      let compileTrigger: () => void;
      
      mockSpawn.mockImplementationOnce(() => {
        compileTrigger = setupChildProcessEvents("", "error: something", 1);
        return mockChild;
      });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      await resultPromise;

      expect(mockRm).toHaveBeenCalledWith("/tmp/embedc-test123", { 
        recursive: true, 
        force: true 
      });
    });

    it("cleans up temp directory on runtime error", async () => {
      const req: RunRequest = { code: "int main() { return 0; }" };
      
      let compileTrigger: () => void;
      let runTrigger: () => void;
      
      mockSpawn
        .mockImplementationOnce(() => {
          compileTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        })
        .mockImplementationOnce(() => {
          runTrigger = setupChildProcessEvents("", "runtime error", 1);
          return mockChild;
        });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      runTrigger!();
      await resultPromise;

      expect(mockRm).toHaveBeenCalledWith("/tmp/embedc-test123", { 
        recursive: true, 
        force: true 
      });
    });

    it("ignores cleanup errors", async () => {
      const req: RunRequest = { code: "int main() { return 0; }" };
      
      let compileTrigger: () => void;
      let runTrigger: () => void;
      
      mockSpawn
        .mockImplementationOnce(() => {
          compileTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        })
        .mockImplementationOnce(() => {
          runTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        });
      
      mockRm.mockRejectedValueOnce(new Error("Permission denied"));

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      runTrigger!();
      
      // Should not throw
      await expect(resultPromise).resolves.toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("handles child process error event", async () => {
      const req: RunRequest = { code: "int main() { return 0; }" };
      
      let compileTrigger: () => void;
      
      mockSpawn.mockImplementationOnce(() => {
        compileTrigger = setupChildProcessEvents("", "", 0, false, new Error("ENOENT"));
        return mockChild;
      });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      const result = await resultPromise;

      expect(result.ok).toBe(false);
      expect(result.stage).toBe("compile");
      expect(result.stderr).toContain("ENOENT");
    });

    it("measures execution time", async () => {
      const req: RunRequest = { code: "int main() { return 0; }" };
      
      let compileTrigger: () => void;
      let runTrigger: () => void;
      
      mockSpawn
        .mockImplementationOnce(() => {
          compileTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        })
        .mockImplementationOnce(() => {
          runTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      // Small delay to ensure time measurement
      await new Promise(r => setTimeout(r, 10));
      runTrigger!();
      const result = await resultPromise;

      expect(result.timeMs).toBeGreaterThanOrEqual(0);
    });

    it("handles undefined stdin gracefully", async () => {
      const req: RunRequest = { code: "int main() { return 0; }" };
      // stdin is undefined
      
      let compileTrigger: () => void;
      let runTrigger: () => void;
      
      mockSpawn
        .mockImplementationOnce(() => {
          compileTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        })
        .mockImplementationOnce(() => {
          runTrigger = setupChildProcessEvents("", "", 0);
          return mockChild;
        });

      const resultPromise = compileAndRun(req);
      compileTrigger!();
      runTrigger!();
      const result = await resultPromise;

      expect(result.ok).toBe(true);
      // stdin.write should not be called when stdin is undefined/empty
    });

    it("handles non-string code input", async () => {
      const req = { code: 123 } as any;
      
      const result = await compileAndRun(req);

      expect(result.ok).toBe(false);
      expect(result.diagnostics).toBe("코드가 비어 있습니다.");
    });
  });
});