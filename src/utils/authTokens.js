import crypto from "crypto";

export const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const getTokenExpiryDate = (minutes = 60) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};