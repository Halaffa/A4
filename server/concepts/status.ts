import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface StatusDoc extends BaseDoc {
  user: ObjectId;
  emoji: string;
}

export default class StatusConcept {
  public readonly status = new DocCollection<StatusDoc>("status");

  async create(user: ObjectId) {
    if (!user) {
      throw new BadValuesError("user cannot be empty");
    }
    const _id = await this.status.createOne({ user, emoji: "none" });
    return { msg: "Status field successfully created!", status: await this.status.readOne({ _id }) };
  }

  async getStatus(query: Filter<StatusDoc>) {
    const status = await this.status.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return status;
  }

  async getByAuthor(user: ObjectId) {
    return await this.getStatus({ user });
  }

  async update(_id: ObjectId, emoji: string) {
    const update = { emoji };
    this.sanitizeUpdate(update);
    await this.status.updateOne({ _id }, update);
    return { msg: "Status successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.update(_id, "none");
    return { msg: "Status deleted successfully!" };
  }

  async isAuthor(user: ObjectId, _id: ObjectId) {
    const status = await this.status.readOne({ _id });
    if (!status) {
      throw new NotFoundError(`Status ${_id} does not exist!`);
    }
    if (status.user.toString() !== user.toString()) {
      throw new StatusUserNotMatchError(user, _id);
    }
  }

  private sanitizeUpdate(update: Partial<StatusDoc>) {
    // Make sure the update cannot change the author.
    const allowedUpdates = ["emoji"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}

export class StatusUserNotMatchError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the user of status {1}!", user, _id);
  }
}
