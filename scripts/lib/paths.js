import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Repo-relative path with forward slashes, for messages. */
export function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

/** Print a list of { file, line, message } problems. */
export function formatProblems(problems) {
  return problems.map((p) => `  ${p.file}${p.line ? `:${p.line}` : ''}  ${p.message}`).join('\n');
}
