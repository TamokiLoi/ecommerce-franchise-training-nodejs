import { v4 as uuidv4 } from "uuid";

export const genVoucherCode = (): string => {
  const uuid = uuidv4().replace(/-/g, "");
  const shortId = uuid.substring(0, 10).toUpperCase();
  return `VOUCHER_${shortId}`;
};
