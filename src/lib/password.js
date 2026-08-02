import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const isHashedPassword = (value) =>
  typeof value === "string" &&
  /^\$2[aby]\$/.test(value);

export const hashPassword = async (plainPassword) => {
  if (!plainPassword) {
    throw new Error("Password is required");
  }

  return bcrypt.hash(String(plainPassword), SALT_ROUNDS);
};

export const verifyPassword = async (
  plainPassword,
  storedPassword
) => {
  if (!plainPassword || !storedPassword) {
    return false;
  }

  const plain = String(plainPassword);
  const stored = String(storedPassword);

  if (!isHashedPassword(stored)) {
    return false;
  }

  return bcrypt.compare(plain, stored);
};
