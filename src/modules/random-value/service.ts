import { randomInt } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { notFound } from "../../lib/errors.js";

const SINGLETON_ID = 1;

function generateTenDigitCode(): string {
  return String(randomInt(0, 10_000_000_000)).padStart(10, "0");
}

function serialize(row: { value: string; updatedAt: Date }) {
  return {
    value: row.value,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const RandomValueService = {
  async getCurrent() {
    const row = await prisma.randomValue.findUnique({ where: { id: SINGLETON_ID } });
    if (!row) throw notFound("Random value");
    return serialize(row);
  },

  async rotate() {
    const value = generateTenDigitCode();
    const row = await prisma.randomValue.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, value },
      update: { value },
    });
    return serialize(row);
  },
};
