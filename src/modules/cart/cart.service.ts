import mongoose, { Types } from "mongoose";
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
import { AuditAction, AuditEntityType, IAuditLogger } from "../audit-log";
import { ICartItemQuery } from "../cart-item";
import { ICustomerQuery } from "../customer";
import { IFranchiseQuery } from "../franchise";
import { IInventoryQuery } from "../inventory";
import { IOrderQuery } from "../order";
import { IPaymentQuery } from "../payment";
import { IProductFranchiseQuery } from "../product-franchise";
import { IVoucherQuery } from "../voucher";
import { CartItemService } from "./cart-item.service";
import { CartOptionItemService } from "./cart-option-item.service";
import { CartPromotionService } from "./cart-promotion.service";
import { CartVoucherService } from "./cart-voucher.service";
import { CartHelper } from "./cart.helper";
import { ICart } from "./cart.interface";
import { CartRepository } from "./cart.repository";
import { AddToCartDto, CreateCartDto } from "./dto/create.dto";
import { UpdateQuantityOptionItemDto } from "./dto/optionItem.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdateCartDto } from "./dto/update.dto";
import { ApplyVoucherDto } from "./dto/voucher.dto";

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
    private readonly cartPromotionService: CartPromotionService,
    private readonly cartVoucherService: CartVoucherService,
    private readonly customerQuery: ICustomerQuery,
    private readonly franchiseQuery: IFranchiseQuery,
    private readonly productFranchiseQuery: IProductFranchiseQuery,
    private readonly cartItemQuery: ICartItemQuery,
    private readonly voucherQuery: IVoucherQuery,
    private readonly orderQuery: IOrderQuery,
    private readonly paymentQuery: IPaymentQuery,
    private readonly inventoryQuery: IInventoryQuery,
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

    const {
      staff_id,
      franchise_id,
      customer_id,
      product_franchise_id,
      quantity,
      options,
      address,
      phone,
      note,
      message,
    } = payload;

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
     * STEP 5 — Get or create ACTIVE cart
     */
    const cart = await this.getOrCreateActiveCart(customer_id, franchise_id, address, phone, message, staff_id);

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
      existingItem.note = note || "";
      await existingItem.save();
    } else {
      await this.cartItemQuery.createCartItem({
        cart_id: cart._id,
        product_franchise_id: productFranchise._id,
        quantity,
        note: note || "",
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

  //   public async removeCartItem(cartItemId: string, loggedUser: UserAuthPayload | CustomerAuthPayload) {
  //     const cartItem = await this.cartItemQuery.getById(cartItemId);

  //     if (!cartItem) throw new HttpException(HttpStatus.BadRequest, "Cart item not found");

  //     await this.cartItemService.removeCartItem(cartItemId, loggedUser);

  //     await this.recalculateCart(cartItem.cart_id);

  //     return this.cartRepo.getCartDetail(cartItem.cart_id);
  //   }

  public async removeCartItem(cartItemId: string, loggedUser: UserAuthPayload | CustomerAuthPayload) {
    const cartItem = await this.cartItemQuery.getById(cartItemId);

    if (!cartItem) {
      throw new HttpException(HttpStatus.BadRequest, "Cart item not found");
    }

    const cartId = cartItem.cart_id;

    // 1. remove item
    await this.cartItemService.removeCartItem(cartItemId, loggedUser);

    // 2. check remaining items
    const remainingItems = await this.cartItemQuery.countItemsByCartId(cartId);

    if (remainingItems === 0) {
      // 🔥 update cart status
      await this.cartRepo.updateStatus(String(cartId), CartStatus.CANCELED);

      // ⚠️ optional: return luôn hoặc vẫn return detail
      return this.cartRepo.getCartDetail(cartId);
    }

    // 3. recalculate nếu vẫn còn item
    await this.recalculateCart(cartId);

    return this.cartRepo.getCartDetail(cartId);
  }

  public async updateOptionItem(
    payload: UpdateQuantityOptionItemDto,
    loggedUser: UserAuthPayload | CustomerAuthPayload,
  ) {
    const cartItem = await this.cartOptionItemService.updateOptionItem(payload, loggedUser);

    if (!cartItem) throw new HttpException(HttpStatus.BadRequest, "Cart item not found");

    await this.recalculateCart(cartItem.cart_id);

    return this.cartRepo.getCartDetail(cartItem.cart_id);
  }

  public async removeOptionItem(
    payload: UpdateQuantityOptionItemDto,
    loggedUser: UserAuthPayload | CustomerAuthPayload,
  ) {
    const cartItem = await this.cartOptionItemService.removeOptionItem(payload, loggedUser);

    if (!cartItem) throw new HttpException(HttpStatus.BadRequest, "Cart item not found");

    await this.recalculateCart(cartItem.cart_id);

    return this.cartRepo.getCartDetail(cartItem.cart_id);
  }

  public async getCartDetail(cartId: string): Promise<ICart> {
    const item = await this.cartRepo.getCartDetail(new Types.ObjectId(cartId));
    if (!item) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.ITEM_NOT_FOUND);
    }
    return item;
  }

  public async getCartsByCustomer(customerId: string, status?: CartStatus) {
    return this.cartRepo.getCartsByCustomer(customerId, status);
  }

  public async countCartsByCustomer(customerId: string, status?: CartStatus): Promise<number> {
    return this.cartRepo.countCartsByCustomer(customerId, status);
  }

  public async countCartItemsInCart(id: string): Promise<number> {
    const cartId = new Types.ObjectId(id);
    return this.cartItemQuery.countItemsByCartId(cartId);
  }

  public async getActiveCart(customerId: string, franchiseId: string): Promise<ICart | null> {
    const cart = await this.cartRepo.getCartStatusActive(customerId, franchiseId);
    if (!cart) return null;
    return this.cartRepo.getCartDetail(cart._id);
  }

  private async getOrCreateActiveCart(
    customerId: string,
    franchiseId: string,
    address?: string,
    phone?: string,
    message?: string,
    staff_id?: string,
  ) {
    let cart = await this.cartRepo.getCartStatusActive(customerId, franchiseId);

    if (cart) {
      return cart;
    }

    return this.cartRepo.create({
      customer_id: new Types.ObjectId(customerId),
      franchise_id: new Types.ObjectId(franchiseId),
      status: CartStatus.ACTIVE,
      address,
      phone,
      message,
      staff_id: staff_id ? new Types.ObjectId(staff_id) : undefined,
    });
  }

  public async applyVoucher(
    id: string,
    payload: ApplyVoucherDto,
    loggedUser: UserAuthPayload | CustomerAuthPayload,
  ): Promise<void> {
    const { voucher_code } = payload;
    const cartId = new Types.ObjectId(id);

    // 1: Load cart
    const finalItem = await this.cartRepo.getCartDetail(cartId);
    const oldSnapshot = this.cartHelper.buildCartItemSnapshot(finalItem);

    // 2: Load voucher
    const voucher = await this.voucherQuery.getActiveVoucherByCode(voucher_code, finalItem.franchise_id);

    if (!voucher) throw new HttpException(HttpStatus.BadRequest, "Voucher not found");

    if (voucher.code === voucher_code) {
      throw new HttpException(HttpStatus.BadRequest, "Cart has already applied this voucher");
    }

    if (voucher.quota_used >= voucher.quota_total || voucher.quota_total === 0) {
      throw new HttpException(HttpStatus.BadRequest, "Voucher is out of quota, not available!");
    }

    // 3: Apply voucher
    await this.cartRepo.applyVoucher(cartId, voucher._id, voucher_code);

    // 4: Recalculate
    await this.recalculateCart(cartId);

    // 5: Build snapshot
    const newSnapshot = this.cartHelper.buildCartItemSnapshot(finalItem);

    // 6: Audit
    await this.auditLogger.log({
      entityType: AuditEntityType.CART,
      entityId: String(finalItem._id),
      action: AuditAction.APPLY_VOUCHER,
      oldData: oldSnapshot,
      newData: newSnapshot,
      changedBy: loggedUser.id,
    });
  }

  public async removeVoucher(id: string, loggedUser: UserAuthPayload | CustomerAuthPayload): Promise<void> {
    const cartId = new Types.ObjectId(id);

    // 1: Load cart
    const finalItem = await this.cartRepo.getCartDetail(cartId);
    const oldSnapshot = this.cartHelper.buildCartItemSnapshot(finalItem);

    if (!finalItem.voucher_id) {
      throw new HttpException(
        HttpStatus.BadRequest,
        "Cart does not have voucher applied, or voucher has been removed!",
      );
    }

    // 2: Remove voucher
    await this.cartRepo.removeVoucher(cartId);

    // 3: Recalculate
    await this.recalculateCart(cartId);

    // 4: Build snapshot
    const newSnapshot = this.cartHelper.buildCartItemSnapshot(finalItem);

    // 5: Audit
    await this.auditLogger.log({
      entityType: AuditEntityType.CART,
      entityId: String(finalItem._id),
      action: AuditAction.REMOVE_VOUCHER,
      oldData: oldSnapshot,
      newData: newSnapshot,
      changedBy: loggedUser.id,
    });
  }

  public async checkoutCart(id: string, loggedUser: UserAuthPayload | CustomerAuthPayload): Promise<ICart> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // 1: Load cart
      const cart = await this.cartRepo.findActiveCartById(id, session);
      if (!cart) {
        throw new HttpException(HttpStatus.BadRequest, "Cart not found or not active");
      }

      // 2: Check if cart is empty
      if (!cart.cart_items?.length) {
        throw new HttpException(HttpStatus.BadRequest, "Cart is empty");
      }

      // 3: Validate cart (product + option + stock)
      await this.validateCartBeforeCheckout(cart);

      // 4: Create order
      const order = await this.orderQuery.createOrder(cart, loggedUser, session);

      // 5: Create payment
      await this.paymentQuery.createPayment(order, loggedUser, session);

      // 6: Update cart status
      await this.cartRepo.updateStatus(id, CartStatus.CHECKED_OUT, session);

      // 7: Return updated cart
      const updatedCart = await this.cartRepo.findById(id);

      if (!updatedCart) {
        throw new HttpException(HttpStatus.BadRequest, "Cart not found");
      }

      // 8: Commit
      await session.commitTransaction();

      // 9: Audit log
      await this.auditLogger.log({
        entityType: AuditEntityType.CART,
        entityId: id,
        action: AuditAction.CART_CHECKOUT,
        oldData: { status: cart.status },
        newData: { status: CartStatus.CHECKED_OUT },
        changedBy: loggedUser.id,
      });

      return updatedCart;
    } catch (error: any) {
      await session.abortTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(HttpStatus.BadRequest, error?.message || "Checkout cart failed");
    } finally {
      await session.endSession();
    }
  }

  public async cancelCart(id: string, loggedUser: UserAuthPayload | CustomerAuthPayload): Promise<ICart> {
    // 0: Check status
    const cart = await this.cartRepo.findActiveCartById(id);
    if (!cart) {
      throw new HttpException(HttpStatus.BadRequest, "Cart not found or not active");
    }

    // 1: Update cart status
    await this.cartRepo.updateStatus(id, CartStatus.CANCELED);

    // 2: Return updated cart
    const updatedCart = await this.cartRepo.findById(id);

    // 3: Audit log
    await this.auditLogger.log({
      entityType: AuditEntityType.CART,
      entityId: id,
      action: AuditAction.CART_CANCEL,
      oldData: { status: CartStatus.ACTIVE },
      newData: { status: CartStatus.CANCELED },
      changedBy: loggedUser.id,
    });

    if (!updatedCart) {
      throw new HttpException(HttpStatus.BadRequest, "Cart not found");
    }

    return updatedCart;
  }

  private async recalculateCart(cartId: Types.ObjectId) {
    // 1. Load cart items
    const items = await this.cartItemQuery.getItemsByCartId(cartId);

    let subtotal = 0;

    /**
     * Recalculate item totals
     */
    for (const item of items) {
      const optionTotal = (item.options || []).reduce(
        (sum, opt) => sum + opt.quantity * item.quantity * opt.price_snapshot,
        0,
      );

      const lineTotal = item.quantity * item.product_cart_price + optionTotal;

      const discountAmount = item.discount_amount || 0;
      const finalLineTotal = lineTotal - discountAmount;

      // update item fields
      item.line_total = lineTotal;
      item.final_line_total = finalLineTotal;

      subtotal += finalLineTotal;
    }

    /**
     * Save updated items
     */
    await this.cartItemQuery.updateBulkCartItems(items);

    /**
     * Load cart (with lock)
     */
    const cart = await this.cartRepo.findByIdForUpdate(cartId.toString());

    if (!cart) throw new HttpException(HttpStatus.BadRequest, "Cart not found");

    /**
     * Update subtotal
     */
    cart.subtotal_amount = subtotal;

    /**
     * Apply promotion
     */
    const promotionResult = await this.cartPromotionService.calculatePromotion(cart, items);
    cart.promotion_id = promotionResult.promotionId;
    cart.promotion_type = promotionResult.type;
    cart.promotion_value = promotionResult.value;
    cart.promotion_discount = promotionResult.discount;

    /**
     * Apply voucher
     */
    const voucherResult = await this.cartVoucherService.calculateVoucher(cart, subtotal);
    cart.voucher_id = voucherResult.voucherId;
    cart.voucher_code = voucherResult.code;
    cart.voucher_type = voucherResult.type;
    cart.voucher_value = voucherResult.value;
    cart.voucher_discount = voucherResult.discount;

    /**
     * Apply loyalty
     */
    TODO: "Apply loyalty";
    // const loyaltyResult = await this.loyaltyService.calculateLoyalty(cart);
    const loyaltyDiscount = 0;

    cart.loyalty_discount = loyaltyDiscount;

    /**
     * Calculate final amount
     */
    cart.final_amount = subtotal - promotionResult.discount - voucherResult.discount - loyaltyDiscount;

    /**
     * Save cart
     */
    await cart.save();
  }

  private async validateCartBeforeCheckout(cart: ICart) {
    const productIds = new Set<Types.ObjectId>();

    for (const item of cart.cart_items) {
      productIds.add(item.product_franchise_id);

      if (item.options?.length) {
        for (const option of item.options) {
          productIds.add(option.product_franchise_id);
        }
      }
    }

    const ids = Array.from(productIds);

    // load products
    const products = await this.productFranchiseQuery.getItemsActiveByIds(ids);

    // load stocks
    const stocks = await this.inventoryQuery.getByProductFranchiseIds(ids);

    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const stockMap = new Map(stocks.map((s) => [String(s.product_franchise_id), s]));

    for (const item of cart.cart_items) {
      const product = productMap.get(String(item.product_franchise_id));

      if (!product) {
        throw new HttpException(HttpStatus.BadRequest, "Product is unavailable");
      }

      const stock = stockMap.get(String(item.product_franchise_id));

      if (!stock || stock.quantity < item.quantity) {
        throw new HttpException(HttpStatus.BadRequest, "Product out of stock");
      }

      if (item.options?.length) {
        for (const option of item.options) {
          const optionProduct = productMap.get(String(option.product_franchise_id));

          if (!optionProduct) {
            throw new HttpException(HttpStatus.BadRequest, "Option product unavailable");
          }

          const optionStock = stockMap.get(String(option.product_franchise_id));

          if (!optionStock || optionStock.quantity < option.quantity) {
            throw new HttpException(HttpStatus.BadRequest, "Option out of stock");
          }
        }
      }
    }
  }
}
