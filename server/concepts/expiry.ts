import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface ExpiryDoc extends BaseDoc {
  resource: ObjectId;
  expire: number;
}

export default class ExpiryConcept {
  public readonly sessionExpire = new DocCollection<ExpiryDoc>("expire_session");

  async create(resource: ObjectId, time: number) {
    if (!time || !resource) {
      throw new BadValuesError("time and resource cannot be empty");
    }
    const now = Date.now();
    const _id = await this.sessionExpire.createOne({ resource, expire: now + time * 1000 });
    return { msg: "Expire successfully created!", expire: await this.sessionExpire.readOne({ _id }) };
  }

  async getTimeLeft(query: ObjectId) {
    const time = await this.sessionExpire.readOne(
      { query },
      {
        sort: { dateUpdated: -1 },
      },
    );

    if (!time) {
      throw new NotFoundError(`Time ${time} does not exist!`);
    }

    return Date.now() - time.expire;
  }

  async refresh(_id: ObjectId, time: number) {
    if (!time || !_id) {
      throw new BadValuesError("time and id cannot be empty");
    }
    const update = { expire: time * 1000 + Date.now() };
    this.sanitizeUpdate(update);
    await this.sessionExpire.updateOne({ _id }, update);
    return { msg: "Expire time successfully updated!" };
  }

  async expire(_id: ObjectId) {
    const timeLeft = await this.getTimeLeft(_id);
    if (timeLeft < 0) {
      // Implement some sort of expire functionality

      // Also delete the expiry
      await this.sessionExpire.deleteOne({ _id });
      return { msg: "Object has expired!", expire: true };
    }
    return { msg: "Object hasn't expired yet!", expire: false };
  }

  private sanitizeUpdate(update: Partial<ExpiryDoc>) {
    // Make sure the update cannot change the author.
    const allowedUpdates = ["expire"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}
