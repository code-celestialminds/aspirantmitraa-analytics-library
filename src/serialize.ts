import { MAX_PAYLOAD_BYTES } from "./constants";
import type { AnalyticsEvent } from "./types";

const textEncoder =
  typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

export function utf8ByteLength(input: string): number {
  if (textEncoder) {
    return textEncoder.encode(input).byteLength;
  }
  // Fallback for rare environments without TextEncoder
  let bytes = 0;
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code <= 0x7f) bytes += 1;
    else if (code <= 0x7ff) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4;
      i += 1;
    } else bytes += 3;
  }
  return bytes;
}

/**
 * Serialize event under the Beacon size limit.
 * Drops optional properties first if needed; drops entirely if still too large.
 */
export function serializeEvent(event: AnalyticsEvent): string | null {
  try {
    let payload = JSON.stringify(event);
    if (utf8ByteLength(payload) <= MAX_PAYLOAD_BYTES) {
      return payload;
    }

    if (event.properties !== undefined) {
      const withoutProps: AnalyticsEvent = { ...event };
      delete withoutProps.properties;
      payload = JSON.stringify(withoutProps);
      if (utf8ByteLength(payload) <= MAX_PAYLOAD_BYTES) {
        return payload;
      }
    }

    return null;
  } catch {
    return null;
  }
}
