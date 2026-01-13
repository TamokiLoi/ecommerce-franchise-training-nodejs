import bcryptjs from "bcryptjs";
import crypto from "crypto";

export const isEmptyPlainObject = (value: unknown): boolean =>
  Object.prototype.toString.call(value) === "[object Object]" && Object.keys(value as object).length === 0;

export const isEmptyObject = <T extends object>(obj: T): boolean => {
  return !Object.keys(obj).length;
};

export const formatResponse = <T>(data: T, success: boolean = true) => {
  return {
    success,
    data,
  };
};

export const encodePassword = async (password: string) => {
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password!, salt);
  return hashedPassword;
};

export const createTokenVerifiedUser = () => {
  return {
    verification_token: crypto.randomBytes(16).toString("hex"),
    verification_token_expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
  };
};

export const encodePasswordUserNormal = async (password: string) => {
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password!, salt);
  return hashedPassword;
};
