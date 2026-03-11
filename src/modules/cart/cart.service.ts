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
} from "../../core";
import { IAuditLogger } from "../audit-log";
import { ICartItemQuery } from "../cart-item";
import { ICustomerQuery } from "../customer";
import { IFranchiseQuery } from "../franchise";
import { IProductFranchiseQuery } from "../product-franchise";
import { CartOptionItemService } from "./cart-option-item.service";
import { CartHelper } from "./cart.helper";
import { ICart } from "./cart.interface";
import { CartRepository } from "./cart.repository";
import { AddToCartDto, CreateCartDto } from "./dto/create.dto";
import { UpdateQuantityOptionItemDto } from "./dto/optionItem.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdateCartDto } from "./dto/update.dto";
import { CartItemService } from "./cart-item.service";

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
    private readonly cartHelper: CartHelper,
    private readonly cartItemService: CartItemService,
    private readonly cartOptionItemService: CartOptionItemService,
    private readonly customerQuery: ICustomerQuery,
    private readonly franchiseQuery: IFranchiseQuery,
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
  ): Promise<ICart | null> {
    /**
     * STEP 0 — Resolve customer / staff
     */
    this.cartHelper.resolveCustomerAndStaff(payload, loggedUser);

    const { franchise_id, customer_id, product_franchise_id, quantity, options, address, phone } = payload;

    /**
     * STEP 1 — Validate franchise
     */
    const franchise = await this.franchiseQuery.getById(franchise_id);
    if (!franchise) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.ITEM_NOT_FOUND_WITH_NAME("Franchise"));
    }

    /**
     * STEP 2 — Validate main product
     */
    const productFranchise = await this.productFranchiseQuery.getItemActive(product_franchise_id);

    if (!productFranchise || productFranchise.franchise_id.toString() !== franchise_id) {
      throw new HttpException(HttpStatus.BadRequest, "Product not available in this franchise");
    }

    /**
     * STEP 3 — Validate toppings
     */
    const toppingsMap = await this.cartHelper.validateAndGetToppings(options, franchise_id);

    /**
     * STEP 4 — Normalize options
     */
    const { normalizedOptions, optionsHash } = this.cartHelper.buildOptionsHash(options);

    /**
     * STEP 5 — Get or create cart
     */
    let cart = await this.cartRepo.getCartStatusActive(customer_id, franchise_id);

    if (!cart) {
      cart = await this.cartRepo.create({
        customer_id: new Types.ObjectId(customer_id),
        franchise_id: new Types.ObjectId(franchise_id),
        status: CartStatus.ACTIVE,
        address: address,
        phone: phone,
      });
    }

    /**
     * STEP 6 — Check existing cart item
     */
    const existingItem = await this.cartItemQuery.getCartItem({
      cart_id: cart._id,
      product_franchise_id: productFranchise._id,
      options_hash: optionsHash,
    });

    /**
     * STEP 7 — Build cart item options
     */
    const optionDocs = this.cartHelper.buildCartItemOptions(normalizedOptions, toppingsMap);

    /**
     * STEP 8 — Create / Update cart item
     */
    if (existingItem) {
      existingItem.quantity += quantity;

      await existingItem.save();
    } else {
      await this.cartItemQuery.createCartItem({
        cart_id: cart._id,
        product_franchise_id: productFranchise._id,
        quantity,
        product_cart_price: productFranchise.price_base,
        options_hash: optionsHash,
        options: optionDocs,
      });
    }

    /**
     * STEP 9 — Recalculate cart
     */
    await this.recalculateCart(cart._id);

    /**
     * STEP 10 — Return cart detail
     */
    return this.cartRepo.getCartDetail(cart._id);
  }

  public async removeCartItem(cartItemId: string, loggedUser: UserAuthPayload | CustomerAuthPayload) {
    const cartItem = await this.cartItemQuery.getById(cartItemId);

    if (!cartItem) throw new Error("Cart item not found");

    await this.cartItemService.removeCartItem(cartItemId, loggedUser);

    await this.recalculateCart(cartItem.cart_id);

    return this.cartRepo.getCartDetail(cartItem.cart_id);
  }

  public async updateOptionItem(
    payload: UpdateQuantityOptionItemDto,
    loggedUser: UserAuthPayload | CustomerAuthPayload,
  ) {
    const cartItem = await this.cartOptionItemService.updateOptionItem(payload, loggedUser);

    if (!cartItem) throw new Error("Cart item not found");

    await this.recalculateCart(cartItem.cart_id);

    return this.cartRepo.getCartDetail(cartItem.cart_id);
  }

  public async removeOptionItem(
    payload: UpdateQuantityOptionItemDto,
    loggedUser: UserAuthPayload | CustomerAuthPayload,
  ) {
    const cartItem = await this.cartOptionItemService.removeOptionItem(payload, loggedUser);

    if (!cartItem) throw new Error("Cart item not found");

    await this.recalculateCart(cartItem.cart_id);

    return this.cartRepo.getCartDetail(cartItem.cart_id);
  }

  private async recalculateCart(cartId: Types.ObjectId) {
    const items = await this.cartItemQuery.getItemsByCartId(cartId);

    let subtotal = 0;

    for (const item of items) {
      const optionTotal = (item.options || []).reduce((sum, opt) => sum + opt.quantity * opt.price_snapshot, 0);

      const lineTotal = item.quantity * item.product_cart_price + optionTotal;

      const finalLineTotal = lineTotal - (item.discount_amount || 0);

      item.line_total = lineTotal;
      item.final_line_total = finalLineTotal;

      await item.save();

      subtotal += finalLineTotal;
    }

    const cart = await this.cartRepo.findByIdForUpdate(cartId.toString());

    if(!cart) throw new Error("Cart not found");

    cart.subtotal_amount = subtotal;

    cart.final_amount =
      subtotal - (cart.promotion_discount || 0) - (cart.voucher_discount || 0) - (cart.loyalty_discount || 0);

    await cart.save();
  }

  public async getCartDetail(cartId: string): Promise<ICart> {
    const item = await this.cartRepo.getCartDetail(new Types.ObjectId(cartId));
    if (!item) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.ITEM_NOT_FOUND);
    }
    return item;
  }

  public async getActiveCart(customerId: string, franchiseId: string): Promise<ICart | null> {
    const cart = await this.cartRepo.getCartStatusActive(customerId, franchiseId);
    if (!cart) return null;
    return this.cartRepo.getCartDetail(cart._id);
  }
}
