import { Types } from "mongoose";
import {
  BaseCrudService,
  BaseFieldName,
  BaseRole,
  CartStatus,
  CustomerAuthPayload,
  HttpException,
  HttpStatus,
  MSG_BUSINESS,
  UserAuthPayload,
  UserType,
} from "../../core";
import { IAuditLogger } from "../audit-log";
import { ICartItemQuery } from "../cart-item";
import { ICustomerQuery } from "../customer";
import { IFranchiseQuery } from "../franchise";
import { IProductFranchiseQuery } from "../product-franchise";
import { ICart } from "./cart.interface";
import { CartRepository } from "./cart.repository";
import { AddCartItemOptionDto, AddToCartDto, CreateCartDto } from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import UpdateCartDto from "./dto/update.dto";

const AUDIT_FIELDS_ITEM = [
  BaseFieldName.FRANCHISE_ID,
  BaseFieldName.CUSTOMER_ID,
  BaseFieldName.STAFF_ID,
] as readonly (keyof ICart)[];

export class CartService extends BaseCrudService<ICart, CreateCartDto, UpdateCartDto, SearchPaginationItemDto> {
  private readonly cartRepo: CartRepository;

  constructor(
    repo: CartRepository,
    private readonly auditLogger: IAuditLogger,
    private readonly franchiseQuery: IFranchiseQuery,
    private readonly customerQuery: ICustomerQuery,
    private readonly productFranchiseQuery: IProductFranchiseQuery,
    private readonly cartItemQuery: ICartItemQuery,
  ) {
    super(repo);
    this.cartRepo = repo;
  }

  // ===== Start CRUD =====
  protected async doSearch(searchDto: SearchPaginationItemDto): Promise<{ data: ICart[]; total: number }> {
    return { data: [], total: 0 };
  }

  protected async getItemsByCondition(
    payload: SearchPaginationItemDto,
    loggedUser: UserAuthPayload,
  ): Promise<{ data: ICart[]; total: number }> {
    const { start_date, end_date } = payload.searchCondition;

    // Permission check
    if (loggedUser.context?.role !== BaseRole.SUPER_ADMIN && loggedUser.context?.role !== BaseRole.ADMIN) {
      if (loggedUser.context?.franchise_id) {
        payload.searchCondition.franchise_id = loggedUser.context?.franchise_id;
      }
    }

    // Validate
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);

      if (start > end) {
        throw new HttpException(HttpStatus.BadRequest, "Start_date must be <= end_date");
      }
    }

    return this.cartRepo.getItems(payload);
  }
  // ===== End CRUD =====

  public async addProductToCart(
    payload: AddToCartDto,
    loggedUser: UserAuthPayload | CustomerAuthPayload,
  ): Promise<ICart> {
    // Step 0: Check logged user is Staff or Customer
    if (loggedUser.type === UserType.USER) {
      payload.staff_id = loggedUser.id;
      if (!payload.customer_id) {
        throw new HttpException(HttpStatus.BadRequest, "Customer id is required");
      }
    } else if (loggedUser.type === UserType.CUSTOMER) {
      payload.customer_id = loggedUser.id;
    }

    const { franchise_id, customer_id, staff_id, product_franchise_id, quantity, options } = payload;

    // Step 1: Validate franchise
    const franchise = await this.franchiseQuery.getById(franchise_id);
    if (!franchise) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.ITEM_NOT_FOUND_WITH_NAME("Franchise"));
    }

    // Step 2:Validate productFranchise
    const productFranchise = await this.productFranchiseQuery.getItemActive(product_franchise_id);

    if (!productFranchise || productFranchise.franchise_id.toString() !== franchise_id) {
      throw new HttpException(HttpStatus.BadRequest, "Product not available in this franchise");
    }

    // Step 3: Validate options
    if (options?.length) {
      for (const option of options) {
        const topping = await this.productFranchiseQuery.getItemActive(option.product_franchise_id);
        if (!topping) {
          throw new HttpException(HttpStatus.BadRequest, "Topping is not available in this franchise");
        }
      }
    }
    const { normalizedOptions, optionsHash } = this.buildOptionsHash(options);

    // Step 4: Create active cart
    let cart = await this.cartRepo.getCartStatusActive(customer_id, franchise_id);

    if (!cart) {
      cart = await this.cartRepo.create({
        customer_id: new Types.ObjectId(customer_id),
        franchise_id: new Types.ObjectId(franchise_id),
        status: CartStatus.ACTIVE,
      });
    }

    // Step 5: Update cart item
    const existingItem = await this.cartItemQuery.getCartItem({
      cart_id: cart._id,
      product_franchise_id: productFranchise._id,
      options_hash: optionsHash,
    });

    if (existingItem) {
      existingItem.quantity += payload.quantity;
      await existingItem.save();
    } else {
      await this.cartItemQuery.createCartItem({
        cart_id: cart._id,
        product_franchise_id: productFranchise._id,
        quantity: payload.quantity,
        product_cart_price: productFranchise.price_base,
        options_hash: optionsHash,
      });
    }
  }

  // Private helper
  private buildOptionsHash(options?: AddCartItemOptionDto[]): {
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
}
