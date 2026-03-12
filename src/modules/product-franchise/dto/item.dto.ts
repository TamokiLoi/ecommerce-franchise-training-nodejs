import { BaseItemDto } from "../../../core/dto";

export interface ProductFranchiseItemDto extends BaseItemDto, PublicProductFranchiseItemDto {
  product_id: string;
  product_name: string;
  franchise_id: string;
  franchise_name: string;
  size: string;
  price_base: number;
}

export interface PublicProductFranchiseItemDto {
  product_franchise_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  franchise_id: string;
  franchise_name: string;
  franchise_code: string;
}

export interface PublicProductItemDto {
  product_franchise_id: string;
  product_id: string;
  product_display_order: number;

  category_id: string;
  category_name: string;
  category_display_order: number;

  SKU: string;
  name: string;
  description: string;
  image_url: string;

  price: number;
  size: string;
  is_available: boolean;

  is_have_topping: boolean;
}

export interface PublicProductDetailDto {
  product_franchise_id: string;
  product_id: string;

  SKU: string;
  name: string;
  description: string;
  content: string;
  image_url: string;
  images_url?: string[];

  price: number;
  size: string;
  is_available: boolean;

  is_have_topping: boolean;
}
