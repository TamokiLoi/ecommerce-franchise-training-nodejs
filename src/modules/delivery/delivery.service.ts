import { ClientSession } from "mongoose";
import { IAuditLogger } from "../audit-log";
import { IAddDeliveryPayload, IDelivery, IDeliveryQuery } from "./delivery.interface";
import { DeliveryRepository } from "./delivery.repository";

export class DeliveryService implements IDeliveryQuery {
  private readonly deliveryRepository: DeliveryRepository;

  constructor(
    repo: DeliveryRepository,
    private readonly auditLogger: IAuditLogger,
  ) {
    this.deliveryRepository = repo;
  }

  public async getById(id: string): Promise<IDelivery | null> {
    return this.deliveryRepository.findById(id);
  }

  public async createDelivery(payload: IAddDeliveryPayload, session?: ClientSession): Promise<IDelivery> {
    return this.deliveryRepository.create(payload, session);
  }
}
