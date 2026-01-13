import { HttpStatus } from "../enums";
import { HttpException } from "../exceptions";
import { isEmptyPlainObject } from "./helpers";

export const checkEmptyObject = <T extends object>(obj: T) => {
  if (isEmptyPlainObject(obj)) {
    throw new HttpException(HttpStatus.BadRequest, "Model data is empty");
  }
};

export const checkUserMatch = (userId: string, userInItem: string, title: string) => {
  if (userId !== userInItem) {
    throw new HttpException(HttpStatus.BadRequest, `You cannot update or delete another user's ${title}!`);
  }
};

export const checkValidUrl = (url: string) => {
  const urlPattern = /^(http:\/\/|https:\/\/)/i;
  return urlPattern.test(url);
};

export const normalizeParam = (param: string) => {
  if (param == null) return null;

  const normalized = String(param).trim();

  if (normalized === "''" || normalized === '""' || normalized === "") {
    return null;
  }

  return normalized.replace(/^["']|["']$/g, "");
};
