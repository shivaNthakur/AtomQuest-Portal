import { prisma } from "../lib/prisma.js";
import { sendEmail } from "../lib/mailer.js";

const GOAL_SUBMIT_DAYS = parseInt(process.env.ESCALATION_GOAL_SUBMIT_DAYS || "7", 10);
const GOAL_APPROVE_DAYS = parseInt(process.env.ESCALATION_GOAL_APPROVE_DAYS || "5", 10);
const CHECKIN_DAYS = parseInt(process.env.ESCALATION_CHECKIN_DAYS || "7", 10);

async function logEscalation(targetUserId, type, message) {
  const existing = await prisma.escalation.findFirst({
    where: {
      targetUserId,
      type,
      resolvedAt: null,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (existing) return;
  await prisma.escalation.create({
    data: { targetUserId, type, message },
  });
}

export async function runEscalations() {
  const now = new Date();

  const goalCycle = await prisma.goalCycle.findFirst({
    where: { phase: "GOAL_SETTING", isActive: true },
  });

  if (goalCycle && now >= goalCycle.opensAt) {
    const cutoff = new Date(goalCycle.opensAt);
    cutoff.setDate(cutoff.getDate() + GOAL_SUBMIT_DAYS);

    if (now > cutoff) {
      const employees = await prisma.user.findMany({
        where: { role: "EMPLOYEE" },
      });

      for (const emp of employees) {
        const submitted = await prisma.goal.count({
          where: {
            employeeId: emp.id,
            cycleId: goalCycle.id,
            status: { in: ["SUBMITTED", "LOCKED", "APPROVED"] },
          },
        });
        if (submitted > 0) continue;

        const msg = `Goals not submitted within ${GOAL_SUBMIT_DAYS} days of cycle open`;
        await logEscalation(emp.id, "GOAL_NOT_SUBMITTED", msg);
        sendEmail({
          to: emp.email,
          subject: "AtomQuest: Submit your goals",
          text: `Hello ${emp.name},\n\n${msg}. Please log in and submit your goal sheet.`,
        });

        if (emp.managerId) {
          const mgr = await prisma.user.findUnique({ where: { id: emp.managerId } });
          if (mgr) {
            sendEmail({
              to: mgr.email,
              subject: `AtomQuest: ${emp.name} has not submitted goals`,
              text: `Hello ${mgr.name},\n\nYour team member ${emp.name} has not submitted goals yet.`,
            });
          }
        }
      }
    }
  }

  const submittedGoals = await prisma.goal.findMany({
    where: { status: "SUBMITTED" },
    include: { employee: { include: { manager: true } } },
  });

  for (const goal of submittedGoals) {
    const daysSince = (now - goal.updatedAt) / (1000 * 60 * 60 * 24);
    if (daysSince < GOAL_APPROVE_DAYS) continue;
    const mgr = goal.employee.manager;
    if (!mgr) continue;

    const msg = `Goal "${goal.title}" pending approval for ${Math.floor(daysSince)} days`;
    await logEscalation(mgr.id, "GOAL_NOT_APPROVED", msg);
    sendEmail({
      to: mgr.email,
      subject: "AtomQuest: Pending goal approvals",
      text: `Hello ${mgr.name},\n\n${msg}. Please review in the portal.`,
    });
  }

  const activeCheckin = await prisma.goalCycle.findFirst({
    where: {
      phase: { in: ["Q1", "Q2", "Q3", "Q4_ANNUAL"] },
      isActive: true,
      opensAt: { lte: now },
      closesAt: { gte: now },
    },
  });

  if (activeCheckin) {
    const cutoff = new Date(activeCheckin.closesAt);
    cutoff.setDate(cutoff.getDate() - CHECKIN_DAYS);

    if (now >= cutoff) {
      const lockedGoals = await prisma.goal.findMany({
        where: { status: "LOCKED" },
        include: { employee: true },
      });

      for (const goal of lockedGoals) {
        const ach = await prisma.achievement.findUnique({
          where: {
            goalId_cycleId: { goalId: goal.id, cycleId: activeCheckin.id },
          },
        });
        if (ach) continue;

        const msg = `Q check-in not completed for goal "${goal.title}"`;
        await logEscalation(goal.employeeId, "CHECKIN_NOT_COMPLETED", msg);
        sendEmail({
          to: goal.employee.email,
          subject: "AtomQuest: Complete your quarterly check-in",
          text: `Hello ${goal.employee.name},\n\n${msg}. Window closes ${activeCheckin.closesAt.toLocaleDateString()}.`,
        });
      }
    }
  }
}
