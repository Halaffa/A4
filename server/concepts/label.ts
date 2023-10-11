import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface LabelDoc extends BaseDoc {
  name: string;
  target: ObjectId;
}

export default class LabelConcept {
  public readonly Labels = new DocCollection<LabelDoc>("labels");

  async create(name: string, target: ObjectId) {
    if (!name || !target) {
      throw new BadValuesError("name and target cannot be empty");
    }
    const _id = await this.Labels.createOne({ name, target });
    return { msg: "Label successfully created!", label: await this.Labels.readOne({ _id }) };
  }

  async getLabels(query: Filter<LabelDoc>) {
    const Labels = await this.Labels.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    if (Labels.length < 1) {
      throw new NotFoundError("Label asked for does not exist.");
    }
    return Labels;
  }

  async update(_id: ObjectId, name: string) {
    const update = { name };
    this.sanitizeUpdate(update);
    await this.getLabels({ _id });
    await this.Labels.updateOne({ _id }, update);
    return { msg: "Label successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.getLabels({ _id });
    await this.Labels.deleteOne({ _id });
    return { msg: "Labels deleted successfully!" };
  }

  async deleteByName(name: string) {
    await this.getLabels({ name });
    await this.Labels.deleteOne({ name });
    return { msg: "Labels deleted successfully!" };
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

export function tierLabel(tier: number, from: ObjectId, to: ObjectId) {
  if (!tier || !from || !to) {
    throw new BadValuesError("Must know tier, who it's from, and who it's for.");
  }
  return to.toString() + "_" + tier.toString() + "_" + from.toString();
}

export function markLabel(name: string, from: ObjectId, to: ObjectId) {
  if (!name || !from || !to) {
    throw new BadValuesError("Must know name, who it's from, and who it's for.");
  }
  return to.toString() + "_" + name + "_" + from.toString();
}
