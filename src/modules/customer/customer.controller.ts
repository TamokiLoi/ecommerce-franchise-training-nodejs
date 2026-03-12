import { NextFunction, Request, Response } from "express";
import {
  AuthenticatedUserRequest,
  BaseCrudController,
  BaseItemSelectDto,
  formatResponse,
  HttpStatus,
  mapItemToSelect,
} from "../../core";
import { ICustomer } from "./customer.interface";
import { mapItemToResponse } from "./customer.mapper";
import CustomerService from "./customer.service";
import CreateCustomerDto from "./dto/create.dto";
import { CustomerItemDto } from "./dto/item.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import UpdateCustomerDto from "./dto/update.dto";

export class CustomerController extends BaseCrudController<
  ICustomer,
  CreateCustomerDto,
  UpdateCustomerDto,
  SearchPaginationItemDto,
  CustomerItemDto,
  CustomerService
> {
  constructor(service: CustomerService) {
    super(service, mapItemToResponse);
  }

  // Override createItem to include user ID and Origin header
  public createItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.service.createItem(
        req.body,
        (req as AuthenticatedUserRequest)?.user?.id || "",
        req.get("Origin"),
      );
      res.status(HttpStatus.Success).json(formatResponse(this.mapToResponse(item)));
    } catch (error) {
      next(error);
    }
  };

  public changeStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.service.changeStatus(id, req.body, (req as AuthenticatedUserRequest).user.id);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  public searchByKeyword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { keyword } = req.query;
      const items = await this.service.searchByKeyword(String(keyword));
      const selectItems = items.map((item) =>
        mapItemToSelect({
          _id: item._id,
          code: "",
          name: item.name,
          email: item.email,
          phone: item.phone,
          image: item.avatar_url,
        }),
      );
      res.status(HttpStatus.Success).json(formatResponse<BaseItemSelectDto[]>(selectItems));
    } catch (error) {
      next(error);
    }
  };
}
