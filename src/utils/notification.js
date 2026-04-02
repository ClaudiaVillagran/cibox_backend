import Notification from "../models/Notification.js";
import User from "../models/User.js";

export const createNotification = async ({
  userId,
  type = "system",
  title,
  message,
  data = {},
}) => {
  return Notification.create({
    user_id: userId,
    type,
    title,
    message,
    data,
  });
};

export const createNotificationsForRole = async ({
  role,
  type = "system",
  title,
  message,
  data = {},
}) => {
  const users = await User.find({ role }).select("_id");

  if (!users.length) return [];

  const payload = users.map((user) => ({
    user_id: user._id,
    type,
    title,
    message,
    data,
  }));

  return Notification.insertMany(payload);
};