import { ClientSession, Types } from "mongoose";
import {
    BaseCrudService,
    BaseFieldName,
    HttpException,
    HttpStatus,
    LoyaltyTransactionType,
    MSG_BUSINESS,
    OrderCustomerFranchiseType,
    UserType,
} from "../../core";
import { AuditAction, AuditEntityType, IAuditLogger, pickAuditSnapshot } from "../audit-log";
import { ICustomerQuery } from "../customer";
import { IFranchiseQuery } from "../franchise";
import { ILoyaltyRuleQuery } from "../loyalty-rule";
import { ILoyaltyTransactionLogger } from "../loyalty-transaction";
import {
    IAddPointPayload,
    ICustomerFranchise,
    ICustomerFranchiseQuery,
    IRestoreUsedPointsPayload,
    IRevertPointPayload,
} from "./customer-franchise.interface";
import { CustomerFranchiseRepository } from "./customer-franchise.repository";
import CreateCustomerFranchiseDto, { ICreateCustomerFranchiseDto } from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import UpdateCustomerFranchiseDto from "./dto/update.dto";

export const AUDIT_FIELDS_ITEM = [
  BaseFieldName.FRANCHISE_ID,
  BaseFieldName.CUSTOMER_ID,
  BaseFieldName.LOYALTY_POINTS,
  BaseFieldName.LOYALTY_TIER,
  BaseFieldName.TOTAL_EARNED_POINTS,
  BaseFieldName.FIRST_ORDER_DATE,
  BaseFieldName.LAST_ORDER_DATE,
] as readonly (keyof ICustomerFranchise)[];

export default class CustomerFranchiseService
  extends BaseCrudService<
    ICustomerFranchise,
    CreateCustomerFranchiseDto,
    UpdateCustomerFranchiseDto,
    SearchPaginationItemDto
  >
  implements ICustomerFranchiseQuery
{
  private readonly customerFranchiseRepo: CustomerFranchiseRepository;

  constructor(
    repo: CustomerFranchiseRepository,
    private readonly auditLogger: IAuditLogger,
    private readonly franchiseQuery: IFranchiseQuery,
    private readonly customerQuery: ICustomerQuery,
    private readonly loyaltyRuleQuery: ILoyaltyRuleQuery,
    private readonly loyaltyTransactionLogger: ILoyaltyTransactionLogger,
  ) {
    super(repo);
    this.customerFranchiseRepo = repo;
  }

  // ===== Start CRUD =====
  protected async doSearch(dto: SearchPaginationItemDto): Promise<{ data: ICustomerFranchise[]; total: number }> {
    return this.customerFranchiseRepo.getItems(dto);
  }

  public async getItem(id: string): Promise<ICustomerFranchise> {
    const item = await this.customerFranchiseRepo.getItem(id);
    if (!item) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.ITEM_NOT_FOUND);
    }
    return item;
  }
  // ===== END CRUD =====

  // Interface ICustomerFranchiseQuery
  public async createCustomerFranchise(
    payload: ICreateCustomerFranchiseDto,
    loggedUserId: string,
    session?: ClientSession,
  ): Promise<ICustomerFranchise | null> {
    const { franchise_id, customer_id } = payload;

    // Validate customer
    const customer = await this.customerQuery.getById(String(customer_id));
    if (!customer) {
      throw new HttpException(HttpStatus.BadRequest, "Customer not found");
    }

    // Validate franchise
    const franchise = await this.franchiseQuery.getById(String(franchise_id));
    if (!franchise) {
      throw new HttpException(HttpStatus.BadRequest, "Franchise not found");
    }

    const customerObjectId = new Types.ObjectId(customer_id);
    const franchiseObjectId = new Types.ObjectId(franchise_id);

    // Check customer existed in CustomerFranchise with the same franchise_id or not
    const existing = await this.customerFranchiseRepo.findOne({
      customer_id: customerObjectId,
      franchise_id: franchiseObjectId,
      is_deleted: false,
    });
    if (existing) {
      throw new HttpException(HttpStatus.BadRequest, "Customer already belongs to this franchise");
    }

    // Create new CustomerFranchise
    const item = await this.repo.create(
      {
        ...payload,
        customer_id: customerObjectId,
        franchise_id: franchiseObjectId,
      },
      session,
    );

    // Audit Log
    const snapshot = pickAuditSnapshot(item, AUDIT_FIELDS_ITEM);
    await this.auditLogger.log({
      entityType: AuditEntityType.CUSTOMER_FRANCHISE,
      entityId: String(item._id),
      action: AuditAction.CREATE,
      newData: snapshot,
      changedBy: loggedUserId,
    });

    return item;
  }

  public async findByCustomerAndFranchise(
    customerId: Types.ObjectId,
    franchiseId: Types.ObjectId,
    session?: ClientSession,
  ): Promise<ICustomerFranchise | null> {
    return this.customerFranchiseRepo.findByCustomerAndFranchise(customerId, franchiseId, session);
  }

  public async addPoints(payload: IAddPointPayload, session?: ClientSession): Promise<boolean> {
    const { orderId, customerId, franchiseId, final_amount, loggedUser } = payload;

    // 1: Get loyalty rule
    const loyaltyRule = await this.loyaltyRuleQuery.getItemByFranchiseId(String(franchiseId), session);

    if (!loyaltyRule) {
      throw new HttpException(
        HttpStatus.BadRequest,
        "Loyalty rule not found. Please contact admin set loyalty rule for this franchise!",
      );
    }

    if (!loyaltyRule.earn_amount_per_point || loyaltyRule.earn_amount_per_point <= 0) {
      throw new HttpException(HttpStatus.BadRequest, "Invalid loyalty rule configuration");
    }

    // 2: Calculate points
    const earnedPoints = Math.floor(final_amount / loyaltyRule.earn_amount_per_point);
    if (earnedPoints <= 0) {
      throw new HttpException(HttpStatus.BadRequest, "Invalid loyalty rule configuration");
    }

    // 3: Update point
    const updatePoint = await this.customerFranchiseRepo.addPoints(customerId, franchiseId, earnedPoints, session);
    if (!updatePoint) {
      throw new HttpException(HttpStatus.BadRequest, "Add points failed");
    }

    // ⭐ NEW: Update stats
    await this.updateCustomerStats(
      {
        customerId,
        franchiseId,
        orderAmount: final_amount,
        earnedPoints,
        action: OrderCustomerFranchiseType.ORDER_SUCCESS,
      },
      session,
    );

    // 4. Get customer franchise
    const customerFranchise = await this.customerFranchiseRepo.findByCustomerAndFranchise(
      customerId,
      franchiseId,
      session,
    );

    if (!customerFranchise) {
      throw new HttpException(HttpStatus.BadRequest, "Customer franchise not found");
    }

    // 5. Log loyalty transaction
    await this.loyaltyTransactionLogger.logLoyaltyTransaction(
      {
        customer_franchise_id: customerFranchise._id,
        order_id: orderId,
        point_change: earnedPoints,
        type: LoyaltyTransactionType.EARN,
        reason: "Order confirmed",
        changed_by_staff: loggedUser.type === UserType.USER ? new Types.ObjectId(loggedUser.id) : undefined,
        changed_by_customer: loggedUser.type === UserType.CUSTOMER ? new Types.ObjectId(loggedUser.id) : undefined,
      },
      session,
    );

    return true;
  }

  public async revertPoints(payload: IRevertPointPayload, session?: ClientSession): Promise<boolean> {
    const { orderId, customerId, franchiseId, final_amount, refundReason, loggedUser } = payload;

    // 1️⃣ Get loyalty transaction (EARN)
    const earnTransaction = await this.loyaltyTransactionLogger.findEarnByOrderId(String(orderId), session);

    if (!earnTransaction) {
      throw new HttpException(HttpStatus.BadRequest, "Loyalty transaction not found");
    }

    const earnedPoints = earnTransaction.point_change;
    if (earnedPoints <= 0) {
      throw new HttpException(HttpStatus.BadRequest, "Invalid earned points");
    }

    // 2️⃣ Revert points
    const revertPoint = await this.customerFranchiseRepo.addPoints(customerId, franchiseId, -earnedPoints, session);
    if (!revertPoint) {
      throw new HttpException(HttpStatus.BadRequest, "Revert points failed");
    }

    // ⭐ NEW: Update stats
    await this.updateCustomerStats(
      {
        customerId,
        franchiseId,
        orderAmount: final_amount,
        earnedPoints,
        action: OrderCustomerFranchiseType.ORDER_CANCEL,
      },
      session,
    );

    // 3️⃣ Get customer franchise
    const customerFranchise = await this.customerFranchiseRepo.findByCustomerAndFranchise(
      customerId,
      franchiseId,
      session,
    );

    if (!customerFranchise) {
      throw new HttpException(HttpStatus.BadRequest, "Customer franchise not found");
    }

    // 4️⃣ Log loyalty transaction
    await this.loyaltyTransactionLogger.logLoyaltyTransaction(
      {
        customer_franchise_id: customerFranchise._id,
        order_id: orderId,
        point_change: -earnedPoints,
        type: LoyaltyTransactionType.REFUND,
        reason: refundReason,
        changed_by_staff: loggedUser.type === UserType.USER ? new Types.ObjectId(loggedUser.id) : undefined,
        changed_by_customer: loggedUser.type === UserType.CUSTOMER ? new Types.ObjectId(loggedUser.id) : undefined,
      },
      session,
    );

    return true;
  }

  public async restoreUsedPoints(payload: IRestoreUsedPointsPayload, session?: ClientSession): Promise<boolean> {
    const { orderId, customerId, franchiseId, points, refundReason, loggedUser } = payload;

    // 1️⃣ Validate points
    if (!points || points <= 0) {
      return true;
    }

    // 2️⃣ Restore points
    const restorePoint = await this.customerFranchiseRepo.addPoints(customerId, franchiseId, points, session);

    if (!restorePoint) {
      throw new HttpException(HttpStatus.BadRequest, "Restore used points failed");
    }

    // 3️⃣ Get customer franchise
    const customerFranchise = await this.customerFranchiseRepo.findByCustomerAndFranchise(
      customerId,
      franchiseId,
      session,
    );

    if (!customerFranchise) {
      throw new HttpException(HttpStatus.BadRequest, "Customer franchise not found");
    }

    // 4️⃣ Log loyalty transaction
    await this.loyaltyTransactionLogger.logLoyaltyTransaction(
      {
        customer_franchise_id: customerFranchise._id,
        order_id: orderId,
        point_change: points,
        type: LoyaltyTransactionType.RESTORE,
        reason: refundReason || "Restore used points due to refund",
        changed_by_staff: loggedUser.type === UserType.USER ? new Types.ObjectId(loggedUser.id) : undefined,
        changed_by_customer: loggedUser.type === UserType.CUSTOMER ? new Types.ObjectId(loggedUser.id) : undefined,
      },
      session,
    );

    return true;
  }

  private async updateCustomerStats(
    payload: {
      customerId: Types.ObjectId;
      franchiseId: Types.ObjectId;
      orderAmount?: number;
      earnedPoints?: number;
      action: OrderCustomerFranchiseType;
    },
    session?: ClientSession,
  ): Promise<boolean> {
    const { customerId, franchiseId, orderAmount = 0, earnedPoints = 0, action } = payload;

    const update: any = {
      $inc: {},
    };

    // 🧠 Handle logic theo action
    if (action === OrderCustomerFranchiseType.ORDER_SUCCESS) {
      if (orderAmount > 0) {
        update.$inc[BaseFieldName.TOTAL_SPENT] = orderAmount;
        update.$inc[BaseFieldName.TOTAL_ORDERS] = 1;
      }

      if (earnedPoints > 0) {
        update.$inc[BaseFieldName.TOTAL_EARNED_POINTS] = earnedPoints;
      }

      // only set if not exists
      update.$setOnInsert = {
        [BaseFieldName.FIRST_ORDER_DATE]: new Date(),
      };
    }

    if (action === OrderCustomerFranchiseType.ORDER_CANCEL) {
      if (orderAmount > 0) {
        update.$inc[BaseFieldName.TOTAL_SPENT] = -orderAmount;
        update.$inc[BaseFieldName.TOTAL_ORDERS] = -1;
      }

      if (earnedPoints > 0) {
        // ⚠️ Confirm business rule (có thể không trừ)
        update.$inc[BaseFieldName.TOTAL_EARNED_POINTS] = -earnedPoints;
      }
    }

    // cleanup empty $inc
    if (Object.keys(update.$inc).length === 0) {
      delete update.$inc;
    }

    const result = await this.customerFranchiseRepo.updateOne(
      {
        [BaseFieldName.CUSTOMER_ID]: customerId,
        [BaseFieldName.FRANCHISE_ID]: franchiseId,
      },
      update,
      session,
    );

    return !!result;
  }
}
