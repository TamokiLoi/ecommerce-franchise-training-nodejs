import { CustomerAuthPayload, HttpException, HttpStatus, UserAuthPayload, UserType } from "../../core";
import { ICartItem } from "../cart-item";
import { IProductFranchise, IProductFranchiseQuery } from "../product-franchise";
import { AddCartItemOptionDto, AddToCartDto } from "./dto/create.dto";

export class CartHelper {
  constructor(private readonly productFranchiseQuery: IProductFranchiseQuery) {}

  public async validateAndGetToppings(
    options?: AddCartItemOptionDto[],
    franchise_id?: string,
  ): Promise<Map<string, IProductFranchise>> {
    const toppingsMap = new Map<string, IProductFranchise>();

    if (!options?.length) {
      return toppingsMap;
    }

    const toppingIds = [...new Set(options.map((o) => o.product_franchise_id))];

    const toppings = await this.productFranchiseQuery.getItemsActiveByIds(toppingIds);

    toppings.forEach((t) => {
      toppingsMap.set(t._id.toString(), t);
    });

    for (const option of options) {
      const topping = toppingsMap.get(option.product_franchise_id);

      if (!topping || topping.franchise_id.toString() !== franchise_id) {
        throw new HttpException(HttpStatus.BadRequest, "Topping is not available in this franchise");
      }
    }

    return toppingsMap;
  }

  public resolveCustomerAndStaff(payload: AddToCartDto, loggedUser: UserAuthPayload | CustomerAuthPayload) {
    if (loggedUser.type === UserType.USER) {
      payload.staff_id = loggedUser.id;

      if (!payload.customer_id) {
        throw new HttpException(HttpStatus.BadRequest, "Customer id is required");
      }
    } else if (loggedUser.type === UserType.CUSTOMER) {
      payload.customer_id = loggedUser.id;
    }
  }

  public buildCartItemOptions(
    normalizedOptions: { product_franchise_id: string; quantity: number }[],
    toppingsMap: Map<string, IProductFranchise>,
  ) {
    if (!normalizedOptions.length) {
      return [];
    }

    return normalizedOptions.map((option) => {
      const topping = toppingsMap.get(option.product_franchise_id);

      if (!topping) {
        throw new HttpException(HttpStatus.BadRequest, "Invalid topping");
      }

      return {
        product_franchise_id: topping._id,
        quantity: option.quantity,
        price_snapshot: topping.price_base,
        discount_amount: 0,
        final_price: topping.price_base,
      };
    });
  }

  public buildOptionsHash(options?: AddCartItemOptionDto[]): {
    normalizedOptions: { product_franchise_id: string; quantity: number }[];
    optionsHash: string;
  } {
    if (!options?.length) {
      return { normalizedOptions: [], optionsHash: "" };
    }

    const optionMap = new Map<string, number>();

    for (const option of options) {
      const currentQty = optionMap.get(option.product_franchise_id) || 0;
      optionMap.set(option.product_franchise_id, currentQty + option.quantity);
    }

    const normalizedOptions = Array.from(optionMap.entries())
      .map(([id, qty]) => ({ product_franchise_id: id, quantity: qty }))
      .sort((a, b) => a.product_franchise_id.localeCompare(b.product_franchise_id));

    const optionsHash = normalizedOptions.map((o) => `${o.product_franchise_id}:${o.quantity}`).join("-");

    return { normalizedOptions, optionsHash };
  }

  public buildCartItemSnapshot(item: ICartItem) {
    return {
      cartItemId: item._id.toString(),
      productId: item.product_franchise_id.toString(),
      quantity: item.quantity,

      options: item.options.map((o) => ({
        optionId: o.product_franchise_id.toString(),
        quantity: o.quantity,
        price: o.price_snapshot,
      })),
    };
  }
}
