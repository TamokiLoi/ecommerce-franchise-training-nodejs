import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { PaginationResponseModel } from "../models/pagination.model";
import { SearchPaginationResponseModel } from "../models";

export const isEmptyPlainObject = (value: unknown): boolean =>
  Object.prototype.toString.call(value) === "[object Object]" && Object.keys(value as object).length === 0;

export const isEmptyObject = <T extends object>(obj: T): boolean => {
  return !Object.keys(obj).length;
};

export const formatResponse = <T>(data: T) => {
  return {
    success: true,
    data,
  };
};

export const formatPaginationResponse = <T>(data: T[], pageInfo: PaginationResponseModel) => {
  return {
    success: true,
    data,
    pageInfo,
  };
};

export const formatSearchPaginationResponse = <T>(
  data: T[],
  paginationInfo: PaginationResponseModel,
): SearchPaginationResponseModel<T> => {
  const result = new SearchPaginationResponseModel<T>();
  const { totalItems, pageSize, pageNum } = paginationInfo;
  result.pageInfo.pageNum = pageNum;
  result.pageInfo.pageSize = pageSize;

  if (totalItems > 0) {
    result.pageData = data;
    result.pageInfo.totalItems = totalItems;
    result.pageInfo.totalPages = Math.ceil(totalItems / pageSize);
  }

  return result;
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

export const generateRandomPassword = (length: number) => {
  return crypto
    .randomBytes(length)
    .toString("base64")
    .slice(0, length)
    .replace(/[^a-zA-Z0-9]/g, "");
};

export const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

export const formatItemsQuery = (
  query: Record<string, unknown>,
  items: Record<string, unknown>,
): Record<string, unknown> => {
  for (const key in items) {
    if (items[key] !== undefined) {
      query[key] = items[key];
    }
  }
  return query;
};
