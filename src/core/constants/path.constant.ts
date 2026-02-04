export const API_PATH = {
  // swagger api-docs
  API_DOCS: "/api-docs",

  // roles
  ROLE: "/api/roles",

  // auth
  AUTH: "/api/auth",
  AUTH_REGISTER: "/register",
  AUTH_LOGIN_SWAGGER: "/login-swagger",
  AUTH_LOGOUT: "/logout",
  AUTH_VERIFY_TOKEN: "/verify-token",
  AUTH_RESEND_TOKEN: "/resend-token",
  AUTH_FORGOT_PASSWORD: "/forgot-password",
  AUTH_CHANGE_PASSWORD: "/change-password",
  AUTH_TRIGGER_VERIFY_TOKEN: "/trigger-verify-token",

  // franchises
  FRANCHISE: "/api/franchises",
  FRANCHISE_SEARCH: "/api/franchises/search",
  FRANCHISE_ID: "/api/franchises/:id",
  FRANCHISE_CHANGE_STATUS: "/api/franchises/:id/status",
  FRANCHISE_RESTORE: "/api/franchises/:id/restore",

  // users
  USER: "/api/users",
  USER_UPDATE: "/update",
  USER_CHANGE_STATUS: "/change-status",
  USER_CHANGE_ROLE: "/change-role",
};
