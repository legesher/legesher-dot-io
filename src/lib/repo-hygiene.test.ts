// Repository hygiene guard for CORE-2214.
//
// A compromised contributor token once pushed a commit onto every branch of
// several organisation repositories. Its shape: a hidden editor task that runs
// as soon as the folder opens, a workspace setting that lets such tasks run
// without a prompt, a file carrying a font extension whose bytes are not a
// font, and a .gitignore edit that stops ignoring .env. This suite fails the
// build when any part of that shape is tracked by git again. It inspects only
// tracked files, so a local, untracked editor configuration never trips it.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

type Repo = { root: string; files: readonly string[] };

type ParsedFile =
  | { path: string; kind: "parsed"; value: unknown }
  | { path: string; kind: "unparseable"; reason: string };

const VSCODE_TASKS = /(^|\/)\.vscode\/tasks\.json$/;
const VSCODE_SETTINGS = /(^|\/)\.vscode\/settings\.json$/;
const FONT_EXTENSION = /\.(woff2?|ttf|otf)$/i;
const FONT_SIGNATURES = new Set([
  "774f4632",
  "774f4646",
  "00010000",
  "74727565",
  "4f54544f",
]);
const BYTE_ORDER_MARK = /^\uFEFF/;
const JSON_STRING_OR_COMMENT =
  /("(?:[^"\\]|\\.)*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
const JSON_STRING_OR_TRAILING_COMMA = /("(?:[^"\\]|\\.)*")|,(\s*[}\]])/g;
// A .gitignore line that ignores a file named .env wherever it sits: `.env`,
// `.env*`, `/.env` or `**/.env`. `.env.*` does not, so it is not accepted.
const DOTENV_IGNORE = /^\/?(\*\*\/)?\.env\*?$/;

function git(args: readonly string[], cwd: string): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
  });
}

function readRepo(): Repo | undefined {
  try {
    const root = git(
      ["rev-parse", "--show-toplevel"],
      dirname(fileURLToPath(import.meta.url))
    ).trim();
    const files = git(["ls-files", "-z"], root)
      .split("\0")
      .filter((path) => path.length > 0);
    return { root, files };
  } catch {
    return undefined;
  }
}

function readTracked(repo: Repo, path: string): string {
  return readFileSync(join(repo.root, path), "utf8");
}

function normaliseJsonc(source: string): string {
  return source
    .replace(BYTE_ORDER_MARK, "")
    .replace(
      JSON_STRING_OR_COMMENT,
      (_match, literal: string | undefined) => literal ?? ""
    )
    .replace(
      JSON_STRING_OR_TRAILING_COMMA,
      (_match, literal: string | undefined, tail: string | undefined) =>
        literal ?? tail ?? ""
    );
}

function parseJsoncFile(repo: Repo, path: string): ParsedFile {
  try {
    return {
      path,
      kind: "parsed",
      value: JSON.parse(normaliseJsonc(readTracked(repo, path))),
    };
  } catch (error) {
    return {
      path,
      kind: "unparseable",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

function unparseable(files: readonly ParsedFile[]): string[] {
  return files.flatMap((file) =>
    file.kind === "unparseable" ? [`${file.path}: ${file.reason}`] : []
  );
}

function parsedValues(
  files: readonly ParsedFile[]
): { path: string; value: unknown }[] {
  return files.flatMap((file) =>
    file.kind === "parsed" ? [{ path: file.path, value: file.value }] : []
  );
}

function containsFolderOpenTask(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsFolderOpenTask);
  }
  if (value === null || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    record["runOn"] === "folderOpen" ||
    Object.values(record).some(containsFolderOpenTask)
  );
}

function allowsAutomaticTasks(value: unknown): boolean {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const setting = (value as Record<string, unknown>)[
    "task.allowAutomaticTasks"
  ];
  return setting === true || setting === "on";
}

function fileSignature(repo: Repo, path: string): string {
  return readFileSync(join(repo.root, path)).subarray(0, 4).toString("hex");
}

function ignoresEnv(gitignore: string): boolean {
  return gitignore.split("\n").some((line) => {
    const pattern = line.trim();
    return (
      !pattern.startsWith("#") &&
      !pattern.startsWith("!") &&
      DOTENV_IGNORE.test(pattern)
    );
  });
}

const repo = readRepo();

if (repo === undefined) {
  it.skip("repository hygiene guard: not inside a git work tree, nothing to check", () => {});
} else {
  const tasksFiles = repo.files
    .filter((path) => VSCODE_TASKS.test(path))
    .map((path) => parseJsoncFile(repo, path));
  const settingsFiles = repo.files
    .filter((path) => VSCODE_SETTINGS.test(path))
    .map((path) => parseJsoncFile(repo, path));
  const fontFiles = repo.files.filter((path) => FONT_EXTENSION.test(path));

  const folderOpenTasks = parsedValues(tasksFiles)
    .filter(({ value }) => containsFolderOpenTask(value))
    .map(({ path }) => path);
  const automaticTaskSettings = parsedValues(settingsFiles)
    .filter(({ value }) => allowsAutomaticTasks(value))
    .map(({ path }) => path);
  const filesWithoutFontSignature = fontFiles
    .map((path) => ({ path, signature: fileSignature(repo, path) }))
    .filter(({ signature }) => !FONT_SIGNATURES.has(signature))
    .map(({ path, signature }) => `${path} (first bytes ${signature})`);
  const trackedEnvFiles = repo.files.filter(
    (path) => basename(path) === ".env"
  );

  describe("repository hygiene guard", () => {
    describe("tracked .vscode/tasks.json", () => {
      it("parses as JSON once comments are stripped", () =>
        expect(unparseable(tasksFiles)).toEqual([]));

      it("declares no task that runs on folder open", () =>
        expect(folderOpenTasks).toEqual([]));
    });

    describe("tracked .vscode/settings.json", () => {
      it("parses as JSON once comments are stripped", () =>
        expect(unparseable(settingsFiles)).toEqual([]));

      it("does not allow automatic tasks", () =>
        expect(automaticTaskSettings).toEqual([]));
    });

    describe("tracked font files", () => {
      it("begin with a font signature", () =>
        expect(filesWithoutFontSignature).toEqual([]));
    });

    describe(".env", () => {
      it("is ignored by the root .gitignore", () =>
        expect(ignoresEnv(readTracked(repo, ".gitignore"))).toBe(true));

      it("is not tracked", () => expect(trackedEnvFiles).toEqual([]));
    });
  });
}
