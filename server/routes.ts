import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Expiry, Friend, Label, Permission, Post, Status, User, WebSession } from "./app";
import { ExpiryDoc } from "./concepts/expiry";
import { LabelDoc } from "./concepts/label";
import { PostDoc, PostOptions } from "./concepts/post";
import { StatusDoc } from "./concepts/status";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

const LOGIN_TIMEOUT = 60 * 60 * 24;

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/labels")
  async getAllLabels() {
    return await Label.getLabels({});
  }

  @Router.get("/expire")
  async getExpireTimeAny() {
    return await Expiry.getTimeLeft({});
  }

  @Router.get("/expire")
  async getExpireTime(_id: ObjectId) {
    return await Expiry.getTimeLeft({ _id });
  }

  @Router.get("/status")
  async getStatus() {
    return await Status.getStatus({});
  }

  @Router.get("/permission")
  async getPerms() {
    return await Permission.getPerms({});
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.post("/labels")
  async createLabel(name: string, target: ObjectId) {
    return await Label.create(name, target);
  }

  @Router.put("/labels")
  async changeLabel(_id: ObjectId, update: Partial<LabelDoc>) {
    return await Label.update(_id, update);
  }

  @Router.delete("/labels")
  async deleteLabel(_id: ObjectId) {
    return await Label.delete(_id);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.put("/expire/time")
  async changeTime(_id: ObjectId, update: Partial<ExpiryDoc>) {
    return await Expiry.refresh(_id, update);
  }

  @Router.post("/expire")
  async makeExpire(resource: ObjectId, time: number) {
    return await Expiry.create(resource, time);
  }

  @Router.get("/expire/resource")
  async didExpire(_id: ObjectId) {
    return await Expiry.expire(_id);
  }

  @Router.post("/permission")
  async grantPermission(user: ObjectId, resource: ObjectId) {
    return await Permission.grantPermission(user, resource);
  }

  @Router.get("/permission/user")
  async getUserPerms(user: ObjectId) {
    return await Permission.getByUser(user);
  }

  @Router.get("/permission/resource")
  async getAllowedUsers(resource: ObjectId) {
    return await Permission.getByResource(resource);
  }

  @Router.get("/permission/user/resource")
  async getSpecificPerm(user: ObjectId, resource: ObjectId) {
    return await Permission.getSpecific(user, resource);
  }

  @Router.delete("/permission")
  async deletePerm(_id: ObjectId) {
    return await Permission.removePermission(_id);
  }

  @Router.delete("/permission/user/resource")
  async revokePerm(user: ObjectId, resource: ObjectId) {
    return await Permission.revokeSpecific(user, resource);
  }

  @Router.post("/status")
  async initStatus(user: ObjectId) {
    return await Status.create(user);
  }

  @Router.get("/user/status")
  async userStatus(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Status.getByAuthor(user);
  }

  @Router.put("/user/status")
  async changeStatus(session: WebSessionDoc, update: Partial<StatusDoc>) {
    const user = WebSession.getUser(session);
    return await Status.update(user, update);
  }

  @Router.delete("/user/status")
  async deleteStatus(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Status.delete(user);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }

  // TODO: Functionality for sync routes
  // TODO: Additional label functions or store usernames in labels?

  @Router.post("/mark")
  async mark(session: WebSessionDoc, to: ObjectId, name: string) {
    const from = WebSession.getUser(session);
    // const labelName = await Label.generateLabel(name, from); ?
    const label = await Label.create(name, to);
    // If from labeled to with label name already:
    //    Change some state to signify mutual marking
    return label;
  }

  @Router.delete("/mark")
  async unmark(session: WebSessionDoc, to: ObjectId, name: string) {
    const from = WebSession.getUser(session);
    // const labelName = await Label.generateLabel(name, from); ?
    const label = await Label.getLabels({ name });
    // If from labeled to with label name already:
    //    Change some state to signify no more mutual marking
    // return Label.delete(label._id); Need a "delete by name" for label
    return;
  }

  @Router.post("/tier")
  async tier(session: WebSessionDoc, otherUser: ObjectId, tier: number) {
    const user = WebSession.getUser(session);
    // const labelName = await Label.tierLabel(name, tier); ?
    const label = await Label.create("user_and_tier", otherUser);
    return label;
  }

  @Router.delete("/tier")
  async untier(session: WebSessionDoc, otherUser: ObjectId, tier: number) {
    const user = WebSession.getUser(session);
    // const labelName = await Label.tierLabel(name, tier); ?
    // return Label.delete(labelName); Need a "delete by name" for label
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    const expireTimer = await Expiry.create(u._id, LOGIN_TIMEOUT);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions, tier?: number) {
    if (!tier) {
      const user = WebSession.getUser(session);
      const created = await Post.create(user, content, options);
      return { msg: created.msg, post: await Responses.post(created.post) };
    }
    // So here we need to consider who has access based on what tier this post is labeled as.
    // Only users with tiers equal to or higher than the given tier by author are granted permission
  }
}

export default getExpressRouter(new Routes());
