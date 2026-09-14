import { isBrowser } from "./storage";
import type { EnvironmentContext, PageContext } from "./types";

export function getPageContext(overrides?: {
  path?: string;
  url?: string;
  title?: string;
}): PageContext | undefined {
  if (!isBrowser()) return undefined;

  const path = overrides?.path ?? window.location.pathname;
  const url =
    overrides?.url ??
    `${window.location.origin}${window.location.pathname}${window.location.search}`;
  const title = overrides?.title ?? (document.title || undefined);

  return { url, path, title };
}

export function getEnvironmentContext(): EnvironmentContext | undefined {
  if (!isBrowser()) return undefined;

  const context: EnvironmentContext = {};

  try {
    if (typeof navigator !== "undefined" && navigator.language) {
      context.language = navigator.language;
    }
  } catch {
    // ignore
  }

  try {
    context.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // ignore
  }

  try {
    if (typeof screen !== "undefined") {
      context.screenWidth = screen.width;
      context.screenHeight = screen.height;
    }
  } catch {
    // ignore
  }

  return context;
}
