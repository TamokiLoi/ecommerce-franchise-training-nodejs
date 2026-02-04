import { ClientSession, Document, Model, UpdateWriteOpResult } from "mongoose";
import { IError } from "../interfaces";
import { normalizeParam } from "../utils";

export class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  public async create(data: Partial<T>, session?: ClientSession): Promise<T> {
    const doc = new this.model(data);
    await doc.save(session ? { session } : undefined);
    return this.toObject(doc);
  }

  public async findById(id: string, is_deleted = false): Promise<T | null> {
    const doc = await this.model.findOne({ _id: id, is_deleted });
    return doc ? this.toObject(doc) : null;
  }

  public async findAll(filter: Partial<T> = {}): Promise<T[]> {
    const docs = await this.model.find({ ...filter, is_deleted: false });
    return docs.map((doc) => this.toObject(doc));
  }

  public async update(id: string, data: Partial<T>, session?: ClientSession): Promise<T> {
    const updatedDoc = await this.model.findOneAndUpdate(
      { _id: id, is_deleted: false },
      { ...data, updated_at: new Date() },
      { new: true, session },
    );

    if (!updatedDoc) {
      throw new Error(`Document with ID ${id} not found`);
    }

    return this.toObject(updatedDoc);
  }

  // delete flag logic
  public async softDeleteById(id: string): Promise<void> {
    const result = await this.model.updateOne(
      { _id: id, is_deleted: false },
      { is_deleted: true, updated_at: new Date() },
    );

    if (result.matchedCount === 0) {
      throw new Error(`Document with ID ${id} not found`);
    }
  }

  // restore flag logic
  public async restoreById(id: string): Promise<T> {
    const doc = await this.model.findOneAndUpdate(
      { _id: id, is_deleted: true },
      { is_deleted: false, updated_at: new Date() },
      { new: true },
    );

    if (!doc) {
      throw new Error(`Document with ID ${id} not found`);
    }

    return this.toObject(doc);
  }

  protected toObject(doc: any): T {
    return doc.toObject() as T;
  }

  public findItemsWithKeyword(
    keyword: string,
    searchableFields: string[],
    additionalQuery: Record<string, unknown> = {},
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

  public async existsByField(
    fieldName: string,
    fieldValue: string,
    options?: { excludeId?: string },
  ): Promise<boolean> {
    const query: any = {
      [fieldName]: fieldValue,
      is_deleted: false,
    };

    if (options?.excludeId) {
      query._id = { $ne: options.excludeId };
    }

    const count = await this.model.countDocuments(query);
    return count > 0;
  }

  public async existsByFields(fields: Record<string, string>, options?: { excludeId?: string }): Promise<string[]> {
    const orConditions = Object.entries(fields)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => ({ [key]: value }));

    if (orConditions.length === 0) return [];

    const query: any = {
      $or: orConditions,
      is_deleted: false,
    };

    if (options?.excludeId) {
      query._id = { $ne: options.excludeId };
    }

    const existedDocs = await this.model.find(query).select(Object.keys(fields).join(" "));

    const duplicatedFields = new Set<string>();

    existedDocs.forEach((doc) => {
      const obj = doc.toObject() as Record<string, any>;

      Object.entries(fields).forEach(([key, value]) => {
        if (obj[key] === value) {
          duplicatedFields.add(key);
        }
      });
    });

    return Array.from(duplicatedFields);
  }
}
