import { BaseField } from "../enums";
import { SearchPaginationResponseModel } from "../models";

export interface IBase {
  [BaseField.GROUP_ID]: String;
  [BaseField.CREATED_AT]?: Date; // default new Date()
  [BaseField.UPDATED_AT]?: Date; // default new Date()
  [BaseField.IS_DELETED]?: boolean; // flag for soft delete, default is false
}

// export interface IBaseService<T, C, U, S> {
//   create(model: C, user: DataStoredInToken): Promise<T>;
//   getItems(model: S): Promise<SearchPaginationResponseModel<T>>;
//   getItem(id: string): Promise<T>;
//   update(id: string, model: U, user: DataStoredInToken): Promise<T>;
//   delete(id: string): Promise<boolean>;
//   findItemsWithKeyword(keyword: string): Promise<T[]>;
// }
