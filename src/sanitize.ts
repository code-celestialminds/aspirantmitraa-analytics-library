import { PROPERTY_LIMITS, SENSITIVE_PROPERTY_KEYS } from "./constants";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function isForbiddenValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "function") return true;
  if (typeof value === "symbol") return true;
  if (typeof value === "bigint") return true;

  if (typeof Element !== "undefined" && value instanceof Element) return true;
  if (typeof Node !== "undefined" && value instanceof Node) return true;
  if (typeof File !== "undefined" && value instanceof File) return true;
  if (typeof Blob !== "undefined" && value instanceof Blob) return true;
  if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) return true;

  return false;
}

function sanitizeValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    return value.length > PROPERTY_LIMITS.maxStringLength
      ? value.slice(0, PROPERTY_LIMITS.maxStringLength)
      : value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "boolean") return value;

  if (isForbiddenValue(value)) return undefined;

  if (depth >= PROPERTY_LIMITS.maxDepth) return undefined;

  if (Array.isArray(value)) {
    if (seen.has(value)) return undefined;
    seen.add(value);
    const out: unknown[] = [];
    const limit = Math.min(value.length, PROPERTY_LIMITS.maxArrayLength);
    for (let i = 0; i < limit; i++) {
      const item = sanitizeValue(value[i], depth + 1, seen);
      if (item !== undefined) out.push(item);
    }
    return out;
  }

  if (!isPlainObject(value)) {
    // Dates etc. — stringify if Date
    if (value instanceof Date) {
      return value.toISOString();
    }
    return undefined;
  }

  if (seen.has(value)) return undefined;
  seen.add(value);

  const out: Record<string, unknown> = {};
  let keyCount = 0;
  for (const key of Object.keys(value)) {
    if (keyCount >= PROPERTY_LIMITS.maxKeys) break;
    if (SENSITIVE_PROPERTY_KEYS.has(key) || SENSITIVE_PROPERTY_KEYS.has(key.toLowerCase())) {
      continue;
    }
    const sanitized = sanitizeValue(value[key], depth + 1, seen);
    if (sanitized !== undefined) {
      out[key] = sanitized;
      keyCount += 1;
    }
  }
  return out;
}

/**
 * Sanitize untrusted event properties. Never throws.
 */
export function sanitizeProperties(
  properties?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!properties || typeof properties !== "object") return undefined;
  try {
    const result = sanitizeValue(properties, 0, new WeakSet()) as
      | Record<string, unknown>
      | undefined;
    if (!result || Object.keys(result).length === 0) return undefined;
    return result;
  } catch {
    return undefined;
  }
}
