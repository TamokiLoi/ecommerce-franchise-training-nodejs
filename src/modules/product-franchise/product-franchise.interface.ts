import { Document, Types } from "mongoose";
import { BaseFieldName } from "../../core/enums";
import { IBase } from "../../core/interfaces";
import { PublicProductDetailDto, PublicProductItemDto } from "./dto/item.dto";

export interface IProductFranchise extends Document, IBase {
  [BaseFieldName.PRODUCT_ID]: Types.ObjectId;
  product_name: string;
  [BaseFieldName.FRANCHISE_ID]: Types.ObjectId;
  franchise_name: string;
  [BaseFieldName.SIZE]?: string | null;
  [BaseFieldName.PRICE_BASE]: number;
}

export interface IProductFranchiseQuery {
  getById(id: string): Promise<IProductFranchise | null>;
  getItemActive(id: string): Promise<IProductFranchise | null>;
  getMenuByFranchise(franchiseId: string, categoryId?: string): Promise<PublicProductItemDto[]>;
  getPublicProducts(franchiseId: string, categoryId?: string): Promise<PublicProductItemDto[]>;
  getPublicProductDetail(franchiseId: string, productId: string): Promise<PublicProductDetailDto | null>;
  getItemsActiveByIds(ids: string[]): Promise<IProductFranchise[]>;
}
