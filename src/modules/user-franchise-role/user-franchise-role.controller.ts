import { NextFunction, Request, Response } from "express";
import { BaseCrudController } from "../../core/controller";
import { HttpStatus } from "../../core/enums";
import { formatResponse } from "../../core/utils";
import { IUserFranchiseRole } from "./user-franchise-role.interface";
import { mapItemToResponse } from "./user-franchise-role.mapper";
import UserFranchiseRoleService from "./user-franchise-role.service";
import CreateUserFranchiseRoleDto from "./dto/create.dto";
import { UserFranchiseRoleResponseDto } from "./dto/item.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import UpdateUserFranchiseRoleDto from "./dto/update.dto";
import { BaseItemSelectDto, mapItemToSelect } from "../../core";

export default class UserFranchiseRoleController extends BaseCrudController<
  IUserFranchiseRole,
  CreateUserFranchiseRoleDto,
  UpdateUserFranchiseRoleDto,
  SearchPaginationItemDto,
  UserFranchiseRoleResponseDto,
  UserFranchiseRoleService
> {
  constructor(service: UserFranchiseRoleService) {
    super(service, mapItemToResponse);
  }

  public getAllRolesByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const items: IUserFranchiseRole[] = await this.service.getAllRolesByUserId(userId);
      res.status(HttpStatus.Success).json(formatResponse<UserFranchiseRoleResponseDto[]>(items.map(mapItemToResponse)));
    } catch (error) {
      next(error);
    }
  };

  public getUsersByFranchiseId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId } = req.params;
      const items: any[] = await this.service.getUsersByFranchiseId(franchiseId);
      const selectItems = items.map((item) =>
        mapItemToSelect({
          _id: item.user_id,
          code: "",
          name: item.user_name,
          email: item.user_email,
          phone: item.user_phone,
          image: item.user_avatar,
        }),
      );
      res.status(HttpStatus.Success).json(formatResponse<BaseItemSelectDto[]>(selectItems));
    } catch (error) {
      next(error);
    }
  };
}
