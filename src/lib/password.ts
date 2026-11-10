import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const ROUNDS = 10;

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function generateTemporaryPassword() {
  return `Abre@${crypto.randomBytes(3).toString("hex")}`;
}
