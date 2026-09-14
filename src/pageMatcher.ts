/**
 * Minimal glob matcher supporting `*` (segment) and `**` (multi-segment).
 * Patterns are matched against a pathname (no origin).
 */
export function matchGlob(pattern: string, path: string): boolean {
  const normalizedPath = normalizePath(path);
  const normalizedPattern = normalizePath(pattern);

  const regex = globToRegExp(normalizedPattern);
  return regex.test(normalizedPath);
}

function normalizePath(path: string): string {
  if (!path) return "/";
  let p = path.startsWith("/") ? path : `/${path}`;
  if (p.length > 1 && p.endsWith("/")) {
    p = p.slice(0, -1);
  }
  return p;
}

function globToRegExp(pattern: string): RegExp {
  let i = 0;
  let out = "^";

  while (i < pattern.length) {
    const ch = pattern[i];

    if (ch === "*" && pattern[i + 1] === "*") {
      // ** matches across segments (including empty)
      if (pattern[i + 2] === "/") {
        out += "(?:.*/)?";
        i += 3;
      } else if (out.endsWith("/")) {
        // trailing /** → optional /rest (so /gate/** matches /gate)
        out = `${out.slice(0, -1)}(?:/.*)?`;
        i += 2;
      } else {
        out += ".*";
        i += 2;
      }
      continue;
    }

    if (ch === "*") {
      out += "[^/]*";
      i += 1;
      continue;
    }

    if (ch === "?") {
      out += "[^/]";
      i += 1;
      continue;
    }

    if ("+.^${}()|[]\\".includes(ch)) {
      out += `\\${ch}`;
    } else {
      out += ch;
    }
    i += 1;
  }

  out += "$";
  return new RegExp(out);
}

/**
 * Conservative page tracking: require an include match; exclude wins.
 * If include is empty/missing, nothing is tracked.
 */
export function shouldTrackPath(
  path: string,
  config?: { enabled?: boolean; include?: string[]; exclude?: string[] },
): boolean {
  if (!config || config.enabled === false) return false;

  const include = config.include ?? [];
  const exclude = config.exclude ?? [];

  if (exclude.some((p) => matchGlob(p, path))) {
    return false;
  }

  if (include.length === 0) {
    return false;
  }

  return include.some((p) => matchGlob(p, path));
}
