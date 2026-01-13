import mongoose, { ClientSession } from "mongoose";

export async function withTransaction<T>(handler: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await handler(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
