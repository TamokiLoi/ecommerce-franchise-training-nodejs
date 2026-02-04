import { Type } from 'class-transformer';
import { IsNotEmptyObject, ValidateNested } from 'class-validator';
import 'reflect-metadata';
import { PaginationRequestModel, PaginationResponseModel } from './pagination.model';

export class SearchPaginationRequestModel<T> {
    constructor(pageInfo: PaginationRequestModel, searchCondition: T) {
        this.pageInfo = pageInfo;
        this.searchCondition = searchCondition;
    }

    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => PaginationRequestModel)
    public pageInfo: PaginationRequestModel;

    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => Object) // Generic type T cannot be used directly here
    public searchCondition: T;
}

export class SearchPaginationResponseModel<T> {
    constructor(pageData: T[] = [], pageInfo: PaginationResponseModel = new PaginationResponseModel()) {
        this.pageData = pageData;
        this.pageInfo = pageInfo;
    }

    public pageData: T[];
    public pageInfo: PaginationResponseModel;
}
