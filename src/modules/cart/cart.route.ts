import { Router } from "express";
import { API_PATH, authMiddleware, customerAuthMiddleware, IRoute, validationMiddleware } from "../../core";
import { CartController } from "./cart.controller";
import { RemoveOptionItemDto, UpdateQuantityOptionItemDto } from "./dto/optionItem.dto";
import { UpdateCartDto } from "./dto/update.dto";

export default class CartRoute implements IRoute {
  public path = API_PATH.CART;
  public router = Router();

  constructor(private readonly controller: CartController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Cart
     *     description: Cart related endpoints
     */

    // POST domain:/api/carts/items - Add cart, add or update cart item, add option in cart item
    this.router.post(API_PATH.CART_ITEM, authMiddleware(), this.controller.addProductToCart);

    // GET domain:/api/carts/:id - Get item
    this.router.get(API_PATH.CART_ID, authMiddleware(), this.controller.getItem);

    // PUT domain:/api/carts/:id - Update item
    this.router.put(
      API_PATH.CART_ID,
      authMiddleware(),
      validationMiddleware(UpdateCartDto),
      this.controller.updateItem,
    );

    // DELETE domain:/api/carts/items/:cartItemId - Delete Cart item
    this.router.delete(API_PATH.CART_ITEM_ID, authMiddleware(), this.controller.removeCartItem);

    // PATCH domain:/api/carts/items/update-option - Update quantity option in cartItem
    this.router.patch(
      API_PATH.UPDATE_OPTION_ITEM,
      authMiddleware(),
      validationMiddleware(UpdateQuantityOptionItemDto),
      this.controller.updateOptionItem,
    );

    // PATCH domain:/api/carts/items/remove-option - Remove option in cartItem
    this.router.patch(
      API_PATH.REMOVE_OPTION_ITEM,
      authMiddleware(),
      validationMiddleware(RemoveOptionItemDto),
      this.controller.removeOptionItem,
    );

    // PATCH domain:/api/carts/items/:cartItemId - Update cart item
    // this.router.patch(API_PATH.CART_ITEM_ID, adminAuthMiddleware(), customerAuthMiddleware(), this.controller.getItem);

    // DELETE domain:/cart/items/:cartItemId - Delete cart item
    // this.router.delete(API_PATH.CART_ITEM_ID, adminAuthMiddleware(), customerAuthMiddleware(), this.controller.getItem);

    // POST domain:/api/carts/apply-voucher - Apply voucher for cart item
    // this.router.post(API_PATH.APPLY_VOUCHER, adminAuthMiddleware(), customerAuthMiddleware(), this.controller.getItem);

    // DELETE domain:/api/carts/remove-voucher/:cartItemId - Remove voucher for cart item
    // this.router.delete(API_PATH.REMOVE_VOUCHER, adminAuthMiddleware(), customerAuthMiddleware(), this.controller.getItem);

    TODO: "Apply voucher for cart item";
  }
}
