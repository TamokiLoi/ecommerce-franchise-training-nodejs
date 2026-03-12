import { generateRandomPassword } from "./helpers";

export const genVoucherCode = (): string => {
  return generateRandomPassword(10).toUpperCase();
};
