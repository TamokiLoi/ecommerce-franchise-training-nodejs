import { mapBaseResponse } from "../../core/mappers";
import { FranchiseResponseDto } from "./dto/franchise.dto";
import { IFranchise } from "./franchise.interface";

export const mapFranchiseToResponse = (item: IFranchise): FranchiseResponseDto => {
  const base = mapBaseResponse(item);
  return {
    ...base,
    code: item.code,
    name: item.name,
    hotline: item.hotline,
    logo_url: item.logo_url,
    address: item.address,
    opened_at: item.opened_at,
    closed_at: item.closed_at,
  };
};
