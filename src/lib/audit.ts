import { prisma } from "./prisma";

export async function auditChange(
  goalId: string,
  changedById: string,
  field: string,
  oldValue: string | null,
  newValue: string | null,
  reason?: string
) {
  return prisma.auditLog.create({
    data: {
      goalId,
      changedById,
      field,
      oldValue,
      newValue,
      reason,
    },
  });
}
