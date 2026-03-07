import { Types } from "mongoose";
import { BaseField } from "../enums";
import { SearchPaginationResponseModel } from "../models";

export interface IBase {
  [BaseField.ID]: Types.ObjectId;
  [BaseField.IS_ACTIVE]?: boolean; // default true
  [BaseField.CREATED_AT]?: Date; // default new Date()
  [BaseField.UPDATED_AT]?: Date; // default new Date()
  [BaseField.IS_DELETED]?: boolean; // flag for soft delete, default is false
}
export interface IBaseNoActiveField {
  [BaseField.ID]: Types.ObjectId; 
  [BaseField.CREATED_AT]?: Date; // default new Date()
  [BaseField.UPDATED_AT]?: Date; // default new Date()
  [BaseField.IS_DELETED]?: boolean; // flag for soft delete, default is false
}
export interface IBaseCrudService<T, CreateDto, UpdateDto, SearchDto> {
  create(dto: CreateDto, userId: string): Promise<T>;
  getItems(dto: SearchDto): Promise<SearchPaginationResponseModel<T>>;
  getItem(id: string): Promise<T>;
  update(id: string, dto: UpdateDto, userId: string): Promise<T>;
  softDelete(id: string, userId: string): Promise<void>;
  restore(id: string, userId: string): Promise<void>;
}
