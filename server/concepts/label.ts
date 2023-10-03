import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface LabelDoc extends BaseDoc {
  name: string;
  target: ObjectId;
}

export default class LabelConcept {
  public readonly postLabels = new DocCollection<LabelDoc>("post_labels");

  async create(name: string, target: ObjectId) {
    const _id = await this.postLabels.createOne({ name, target });
    return { msg: "Label successfully created!", label: await this.postLabels.readOne({ _id }) };
  }

  async getLabels(query: Filter<LabelDoc>) {
    const postLabels = await this.postLabels.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return postLabels;
  }

  async update(_id: ObjectId, update: Partial<LabelDoc>) {
    this.sanitizeUpdate(update);
    await this.postLabels.updateOne({ _id }, update);
    return { msg: "Label successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.postLabels.deleteOne({ _id });
    return { msg: "Labels deleted successfully!" };
  }

  // Hmmm... How do we do this?
  // Should we actually keep track of the author of labels?
  async isAuthor(user: ObjectId, _id: ObjectId) {
    // const post = await this.posts.readOne({ _id });
    // if (!post) {
    //   throw new NotFoundError(`Post ${_id} does not exist!`);
    // }
    // if (post.author.toString() !== user.toString()) {
    //   throw new PostAuthorNotMatchError(user, _id);
    // }
  }

  private sanitizeUpdate(update: Partial<LabelDoc>) {
    // Make sure the update cannot change the author.
    const allowedUpdates = ["name"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}
