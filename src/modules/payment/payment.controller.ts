import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import {
  AuthenticatedUserRequest,
  CustomerAuthPayload,
  formatResponse,
  HttpStatus,
  PaymentStatus,
  UserAuthPayload,
} from "../../core";
import { IPayment } from "./payment.interface";
import { PaymentService } from "./payment.service";

export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  public getPaymentDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item: IPayment = await this.service.getPaymentDetail(id);
      res.status(HttpStatus.Success).json(formatResponse(item));
    } catch (error) {
      next(error);
    }
  };

  public getPaymentDetailByCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.query;
      const item: IPayment = await this.service.getPaymentDetailByCode(code as string);
      res.status(HttpStatus.Success).json(formatResponse(item));
    } catch (error) {
      next(error);
    }
  };

  public getPaymentByOrderId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const item: IPayment = await this.service.getPaymentByOrderId(orderId);
      res.status(HttpStatus.Success).json(formatResponse(item));
    } catch (error) {
      next(error);
    }
  };

  public getPaymentsByCustomerId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { customerId } = req.params;
      const { status } = req.query;
      const items: IPayment[] = await this.service.getPaymentsByCustomerId(customerId, status as PaymentStatus);
      res.status(HttpStatus.Success).json(formatResponse(items));
    } catch (error) {
      next(error);
    }
  };

  public getPaymentsByFranchiseId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId } = req.params;
      const { status } = req.query;
      const items: IPayment[] = await this.service.getPaymentsByFranchiseId(franchiseId, status as PaymentStatus);
      res.status(HttpStatus.Success).json(formatResponse(items));
    } catch (error) {
      next(error);
    }
  };

  public confirmPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const loggedUser: UserAuthPayload | CustomerAuthPayload = (req as AuthenticatedUserRequest)?.user;
      const item: IPayment = await this.service.confirmPayment(id, req.body, loggedUser);
      res.status(HttpStatus.Success).json(formatResponse(item));
    } catch (error) {
      next(error);
    }
  };

  public refundPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const loggedUser: UserAuthPayload | CustomerAuthPayload = (req as AuthenticatedUserRequest)?.user;
      const item: IPayment = await this.service.refundPayment(id, req.body, loggedUser);
      res.status(HttpStatus.Success).json(formatResponse(item));
    } catch (error) {
      next(error);
    }
  };
}
