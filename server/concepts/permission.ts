import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface PermissionDoc extends BaseDoc {
  user: ObjectId;
  resource: ObjectId;
}

export default class PermissionConcept {
  public readonly perms = new DocCollection<PermissionDoc>("perms");

  async grantPermission(user: ObjectId, resource: ObjectId) {
    if (!user || !resource) {
      throw new BadValuesError("user and resource cannot be empty");
    }
    if (
      await this.getSpecific(user, resource).catch(() => {
        return false;
      })
    ) {
      throw new PermissionAlreadyGrantedError(user, resource);
    }
    const _id = await this.perms.createOne({ user, resource });
    return { msg: `Permission granted to user ${user}!`, perm: await this.perms.readOne({ _id }) };
  }

  async getPerms(query: Filter<PermissionDoc>) {
    const perms = await this.perms.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return perms;
  }

  async getByUser(user: ObjectId) {
    return await this.getPerms({ user });
  }

  async getByResource(resource: ObjectId) {
    return await this.getPerms({ resource });
  }

  async getSpecific(user: ObjectId, resource: ObjectId) {
    const perm = await this.perms.readOne({ user, resource });
    if (!perm) {
      throw new NotFoundError(`${user} does not have a pass for ${resource}`);
    }
    return perm;
  }

  async removePermission(_id: ObjectId) {
    const perm = await this.perms.readOne({ _id });
    if (!perm) {
      throw new NotFoundError(`Permission with id ${_id} doesn't exist.`);
    }
    await this.perms.deleteOne({ _id });
    return { msg: "Permission revoked!" };
  }

  async revokeSpecific(user: ObjectId, resource: ObjectId) {
    const perm = await this.perms.readOne({ user, resource });
    if (!perm) {
      throw new NotFoundError(`${user} did not have a pass for ${resource}`);
    }
    await this.perms.deleteOne({ user, resource });
    return { msg: "Permission revoked!" };
  }
}

export class PermissionAlreadyGrantedError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} has already been granted permission to {1}!", user, _id);
  }
}
