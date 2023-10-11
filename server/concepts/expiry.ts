import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface ExpiryDoc extends BaseDoc {
  resource: ObjectId;
  expire: number;
}

export default class ExpiryConcept {
  public readonly expireData = new DocCollection<ExpiryDoc>("expire");

  async create(resource: ObjectId, time: number) {
    if (!time || !resource) {
      throw new BadValuesError("time and resource cannot be empty");
    }
    const now = Date.now();
    const _id = await this.expireData.createOne({ resource, expire: now + time * 1000 });
    return { msg: "Expire successfully created!", expire: await this.expireData.readOne({ _id }) };
  }

  async getTimeLeft(_id: ObjectId) {
    const time = await this.expireData.readOne(
      { _id },
      {
        sort: { dateUpdated: -1 },
      },
    );

    if (!time) {
      throw new NotFoundError(`Time ${_id} does not exist!`);
    }

    return Date.now() - time.expire;
  }

  async refresh(_id: ObjectId, time: number) {
    if (!time || !_id) {
      throw new BadValuesError("time and id cannot be empty");
    }
    await this.getTimeLeft(_id);
    const update = { expire: time * 1000 + Date.now() };
    this.sanitizeUpdate(update);
    await this.expireData.updateOne({ _id }, update);
    return { msg: "Expire time successfully updated!" };
  }

  async expire(_id: ObjectId) {
    if ((await this.getTimeLeft(_id)) > 0) {
      await this.expireData.deleteOne({ _id });
      return { msg: "Object has expired!", expire: true };
    }
    return { msg: "Object hasn't expired yet!", expire: false };
  }

  private sanitizeUpdate(update: Partial<ExpiryDoc>) {
    const allowedUpdates = ["expire"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}
