import { MSG_BUSINESS } from "../../core/constants";
import { HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { IError } from "../../core/interfaces";
import { SearchPaginationResponseModel } from "../../core/models";
import {
  checkEmptyObject,
  formatSearchPaginationResponse,
  normalizeCode,
  normalizeName,
  toMinutes,
} from "../../core/utils";
import { DataStoredInToken } from "../auth/auth.interface";
import CreateFranchiseDto from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import UpdateFranchiseDto from "./dto/update.dto";
import UpdateStatusDto from "./dto/updateStatus.dto";
import { FranchiseFieldName } from "./franchise.enum";
import { IFranchise } from "./franchise.interface";
import { FranchiseRepository } from "./franchise.repository";

type FranchiseTimeContext = {
  opened_at: string;
  closed_at: string;
};

export default class FranchiseService {
  constructor(private readonly repo: FranchiseRepository) {}

  public async createItem(model: CreateFranchiseDto, loggedUser: DataStoredInToken): Promise<IFranchise> {
    await checkEmptyObject(model);

    const { code, name } = model;

    const normalizedCode = normalizeCode(code);
    const normalizedName = normalizeName(name);

    const errors: IError[] = [];

    // 1. Check unique code
    if (await this.repo.existsByField(FranchiseFieldName.CODE, normalizedCode)) {
      errors.push({
        field: FranchiseFieldName.CODE,
        message: MSG_BUSINESS.ITEM_EXISTS("Franchise code"),
      });
    }

    // 2. Check business rules (OPEN < CLOSE)
    this.validateBusinessRules(
      {
        opened_at: model.opened_at,
        closed_at: model.closed_at,
      },
      errors,
    );

    // 3. Check validation errors
    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }

    // TODO: log audit loggedUser info

    // 4. Create record
    return this.repo.create({
      ...model,
      code: normalizedCode,
      name: normalizedName,
    });
  }

  public async getItem(id: string): Promise<IFranchise> {
    const item = await this.repo.findById(id);
    if (!item) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.ITEM_NOT_FOUND);
    }
    return item;
  }

  public async getItems(dataSearch: SearchPaginationItemDto): Promise<SearchPaginationResponseModel<IFranchise>> {
    const { data, total } = await this.repo.getItems(dataSearch);
    const { pageNum, pageSize } = dataSearch.pageInfo;

    return formatSearchPaginationResponse(data, {
      pageNum,
      pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    });
  }

  public async updateItem(id: string, model: UpdateFranchiseDto, loggedUser: DataStoredInToken): Promise<IFranchise> {
    await checkEmptyObject(model);

    const errors: IError[] = [];

    const currentItem = await this.repo.findById(id);
    if (!currentItem) {
      throw new HttpException(HttpStatus.NotFound, MSG_BUSINESS.ITEM_NOT_FOUND);
    }

    // 1. Merge data
    const newItem = {
      ...currentItem,
      ...model,
    };

    // 2. Normalize if have updated
    if (model.code) {
      newItem.code = normalizeCode(model.code);
    }

    if (model.name) {
      newItem.name = normalizeName(model.name);
    }

    // 3. Check unique code (exclude itself)
    if (
      newItem.code &&
      //   newItem.code !== currentItem.code &&
      (await this.repo.existsByField(FranchiseFieldName.CODE, newItem.code, { excludeId: id }))
    ) {
      errors.push({
        field: FranchiseFieldName.CODE,
        message: MSG_BUSINESS.ITEM_EXISTS("Franchise code"),
      });
    }

    // 4. Check business rules (OPEN < CLOSE)
    this.validateBusinessRules(
      {
        opened_at: newItem.opened_at,
        closed_at: newItem.closed_at,
      },
      errors,
    );

    // 5. Check validation errors
    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }

    // TODO: log audit loggedUser info

    // 6. Update only changed fields
    return this.repo.update(id, {
      ...model,
      ...(model.code && { code: newItem.code }),
      ...(model.name && { name: newItem.name }),
    });
  }

  public async changeStatus(id: string, data: UpdateStatusDto, loggedUser: DataStoredInToken): Promise<void> {
    const { is_active } = data;

    const currentItem = await this.repo.findById(id);
    if (!currentItem) {
      throw new HttpException(HttpStatus.NotFound, MSG_BUSINESS.ITEM_NOT_FOUND);
    }

    if (currentItem.is_active === is_active) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.STATUS_NO_CHANGE);
    }

    // TODO: log audit loggedUser info
    await this.repo.update(id, { is_active });
  }

  public async softDeleteItem(id: string, loggedUser: DataStoredInToken): Promise<void> {
    const currentItem = await this.repo.findById(id);
    if (!currentItem) {
      throw new HttpException(HttpStatus.NotFound, MSG_BUSINESS.ITEM_NOT_FOUND);
    }
    await this.repo.softDeleteById(id);
  }

  public async restoreItem(id: string, loggedUser: DataStoredInToken): Promise<IFranchise> {
    const currentItem = await this.repo.findById(id, true);
    if (!currentItem) {
      throw new HttpException(HttpStatus.NotFound, MSG_BUSINESS.ITEM_NOT_FOUND_OR_RESTORED);
    }
    return this.repo.restoreById(id);
  }

  private validateBusinessRules(data: FranchiseTimeContext, errors: IError[]) {
    const openMinutes = toMinutes(data.opened_at);
    const closeMinutes = toMinutes(data.closed_at);

    if (openMinutes >= closeMinutes) {
      errors.push(
        {
          field: FranchiseFieldName.OPENED_AT,
          message: MSG_BUSINESS.OPENED_BEFORE_CLOSED,
        },
        {
          field: FranchiseFieldName.CLOSED_AT,
          message: MSG_BUSINESS.CLOSED_AFTER_OPENED,
        },
      );
    }
  }
}
