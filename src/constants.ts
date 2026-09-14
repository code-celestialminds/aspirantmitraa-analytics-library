/** Safe payload limit with margin under the 64 KiB Beacon API cap. */
export const MAX_PAYLOAD_BYTES = 60 * 1024;

export const STORAGE_KEYS = {
  anonymousId: "am_analytics_anonymous_id",
  session: "am_analytics_session",
  attribution: "am_analytics_attribution",
} as const;

/** Default session inactivity timeout: 30 minutes. */
export const DEFAULT_SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export const ID_PREFIX = {
  anonymous: "anon_",
  session: "sess_",
} as const;

export const SENSITIVE_PROPERTY_KEYS = new Set([
  "password",
  "passwd",
  "pwd",
  "secret",
  "token",
  "access_token",
  "accessToken",
  "refresh_token",
  "refreshToken",
  "authorization",
  "auth",
  "api_key",
  "apiKey",
  "apikey",
  "email",
  "phone",
  "mobile",
  "otp",
  "ssn",
  "credit_card",
  "creditCard",
  "card_number",
  "cardNumber",
  "cvv",
]);

export const PROPERTY_LIMITS = {
  maxDepth: 3,
  maxKeys: 50,
  maxStringLength: 2048,
  maxArrayLength: 50,
} as const;
