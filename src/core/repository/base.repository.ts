import { Document, Model, UpdateWriteOpResult } from "mongoose";
import { IError } from "../interfaces";
import { normalizeParam } from "../utils";

export class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  public async create(data: Partial<T>): Promise<T> {
    const newItem = new this.model(data);
    return (await newItem.save()) as T;
  }

  public findById(id: string): Promise<T | null> {
    return this.model.findOne({ _id: id, is_deleted: false });
  }

  public findAll(): Promise<T[]> {
    return this.model.find().exec();
  }

  public findItemsWithKeyword(
    keyword: string,
    searchableFields: string[],
    additionalQuery: Record<string, unknown> = {}
  ): Promise<T[]> {
    const query: Record<string, unknown> = { ...additionalQuery };

    const keywordValue = normalizeParam(keyword)?.trim();
    if (keywordValue) {
      query.$or = searchableFields.map((field) => ({
        [field]: { $regex: keywordValue, $options: "i" },
      })) as Record<string, unknown>[];
    }

    return this.model
      .find({ ...query, is_deleted: false })
      .sort({ updated_at: -1 })
      .exec();
  }

  public async update(id: string, data: Partial<T>): Promise<T> {
    const updatedDoc = await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!updatedDoc) {
      throw new Error(`Document with ID ${id} not found`);
    }
    return updatedDoc;
  }

  // delete flag logic
  public delete(id: string): Promise<UpdateWriteOpResult> {
    return this.model.updateOne({ _id: id }, { is_deleted: true, updated_at: new Date() });
  }

  // check fields duplicate
  public async checkFieldsExists<T>(
    fields: { fieldName: string; fieldValue: string }[],
    errorResults: IError[],
    title: string
  ): Promise<IError[]> {
    for (const { fieldName, fieldValue } of fields) {
      const fieldValid = await this.checkFieldExists(fieldName, fieldValue);
      if (fieldValid) {
        errorResults.push({
          message: `${title} with ${fieldName.replace("_", " ")} '${fieldValue}' already exists!`,
          field: fieldName,
        });
      }
    }
    return errorResults;
  }

  // check field duplicate
  public async checkFieldExists<T>(fieldName: string, fieldValue: string): Promise<T | null> {
    const escapedValue = fieldValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const query = {
      [fieldName]: { $regex: new RegExp("^" + escapedValue + "$", "i") },
    } as Record<string, unknown>;

    return await this.model.findOne(query);
  }
}
