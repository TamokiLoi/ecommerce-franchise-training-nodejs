export const AUTH_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN: "30m",
  REFRESH_TOKEN_EXPIRES_IN: "7d",

  ACCESS_COOKIE_MAX_AGE: 30 * 60 * 1000, // 30 minutes
  REFRESH_COOKIE_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

export const TOKEN = {
    ACCESS_TOKEN: "access_token",
    REFRESH_TOKEN: "refresh_token"
}