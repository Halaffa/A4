import ExpiryConcept from "./concepts/expiry";
import FriendConcept from "./concepts/friend";
import LabelConcept from "./concepts/label";
import PermissionConcept from "./concepts/permission";
import PostConcept from "./concepts/post";
import StatusConcept from "./concepts/status";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Friend = new FriendConcept();
export const Label = new LabelConcept();
export const Status = new StatusConcept();
export const Permission = new PermissionConcept();
export const Expiry = new ExpiryConcept();
