/**
 * Atomberg demo seed — run: npm run db:seed
 * Password for all users: demo1234
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** BRD calendar months (May / Jul / Oct / Jan / Mar–Apr). */
const PHASE = {
  GOAL_SETTING: { o: 5, c: 5 },
  Q1: { o: 7, c: 7 },
  Q2: { o: 10, c: 10 },
  Q3: { o: 1, c: 1 },
  Q4_ANNUAL: { o: 3, c: 4 },
};

function phaseDates(year, phase) {
  const p = PHASE[phase];
  const lastDay = new Date(year, p.c, 0).getDate();
  return {
    opensAt: new Date(year, p.o - 1, 1),
    closesAt: new Date(year, p.c - 1, lastDay, 23, 59, 59, 999),
  };
}

function isCurrentPhase(phase) {
  const m = new Date().getMonth() + 1;
  const p = PHASE[phase];
  if (phase === "Q4_ANNUAL") return m >= p.o && m <= p.c;
  return m >= p.o && m <= p.c;
}

async function upsertCycle(year, phase, extraActive = false) {
  const { opensAt, closesAt } = phaseDates(year, phase);
  return prisma.goalCycle.upsert({
    where: { year_phase: { year, phase } },
    create: {
      year,
      phase,
      opensAt,
      closesAt,
      isActive: isCurrentPhase(phase) || extraActive,
    },
    update: {
      opensAt,
      closesAt,
      isActive: isCurrentPhase(phase) || extraActive,
    },
  });
}

async function main() {
  console.log("Seeding AtomQuest — Atomberg demo data…");

  const thrustAreas = await Promise.all(
    [
      "Revenue & Distribution",
      "Product Innovation (BLDC)",
      "Manufacturing Excellence",
      "Customer Experience",
      "People & Culture",
    ].map((name) =>
      prisma.thrustArea.upsert({
        where: { name },
        create: { name },
        update: {},
      })
    )
  );

  const now = new Date();
  const year = now.getFullYear();

  const cycle = await upsertCycle(year, "GOAL_SETTING", true);
  const q1Cycle = await upsertCycle(year, "Q1", true);
  await upsertCycle(year, "Q2");
  await upsertCycle(year, "Q3");
  await upsertCycle(year, "Q4_ANNUAL");

  const hash = await bcrypt.hash("demo1234", 10);

  const admin = await prisma.user.upsert({
    where: { email: "hr.admin@atomberg.com" },
    create: {
      email: "hr.admin@atomberg.com",
      name: "Anita Desai",
      passwordHash: hash,
      role: "ADMIN",
      department: "People & HR",
    },
    update: {},
  });

  const mgr1 = await prisma.user.upsert({
    where: { email: "vikram.singh@atomberg.com" },
    create: {
      email: "vikram.singh@atomberg.com",
      name: "Vikram Singh",
      passwordHash: hash,
      role: "MANAGER",
      department: "Sales & Distribution",
    },
    update: {},
  });

  const mgr2 = await prisma.user.upsert({
    where: { email: "neha.kapoor@atomberg.com" },
    create: {
      email: "neha.kapoor@atomberg.com",
      name: "Neha Kapoor",
      passwordHash: hash,
      role: "MANAGER",
      department: "Product Engineering",
    },
    update: {},
  });

  const emp1 = await prisma.user.upsert({
    where: { email: "priya.sharma@atomberg.com" },
    create: {
      email: "priya.sharma@atomberg.com",
      name: "Priya Sharma",
      passwordHash: hash,
      role: "EMPLOYEE",
      department: "Sales & Distribution",
      managerId: mgr1.id,
    },
    update: { managerId: mgr1.id },
  });

  const emp2 = await prisma.user.upsert({
    where: { email: "amit.gupta@atomberg.com" },
    create: {
      email: "amit.gupta@atomberg.com",
      name: "Amit Gupta",
      passwordHash: hash,
      role: "EMPLOYEE",
      department: "Sales & Distribution",
      managerId: mgr1.id,
    },
    update: { managerId: mgr1.id },
  });

  await prisma.user.upsert({
    where: { email: "deepak.raj@atomberg.com" },
    create: {
      email: "deepak.raj@atomberg.com",
      name: "Deepak Raj",
      passwordHash: hash,
      role: "EMPLOYEE",
      department: "Product Engineering",
      managerId: mgr2.id,
    },
    update: { managerId: mgr2.id },
  });

  await prisma.user.upsert({
    where: { email: "kavya.menon@atomberg.com" },
    create: {
      email: "kavya.menon@atomberg.com",
      name: "Kavya Menon",
      passwordHash: hash,
      role: "EMPLOYEE",
      department: "Product Engineering",
      managerId: mgr2.id,
    },
    update: { managerId: mgr2.id },
  });

  await prisma.user.upsert({
    where: { email: "arjun.das@atomberg.com" },
    create: {
      email: "arjun.das@atomberg.com",
      name: "Arjun Das",
      passwordHash: hash,
      role: "EMPLOYEE",
      department: "Sales & Distribution",
      managerId: mgr1.id,
    },
    update: { managerId: mgr1.id },
  });

  const deptSales = await prisma.department.upsert({
    where: { slug: "sales-distribution" },
    create: {
      name: "Sales & Distribution",
      slug: "sales-distribution",
      description: "Retail, trade & e-commerce growth — Atomberg India",
    },
    update: {},
  });

  const deptEng = await prisma.department.upsert({
    where: { slug: "product-engineering" },
    create: {
      name: "Product Engineering",
      slug: "product-engineering",
      description: "BLDC motors, IoT fans & smart appliances R&D",
    },
    update: {},
  });

  const deptHr = await prisma.department.upsert({
    where: { slug: "people-hr" },
    create: {
      name: "People & HR",
      slug: "people-hr",
      description: "Talent, culture & performance — Atomberg Group",
    },
    update: {},
  });

  const teamSales = await prisma.team.upsert({
    where: {
      departmentId_name: { departmentId: deptSales.id, name: "North India Sales" },
    },
    create: {
      name: "North India Sales",
      departmentId: deptSales.id,
      managerId: mgr1.id,
    },
    update: { managerId: mgr1.id },
  });

  const teamEng = await prisma.team.upsert({
    where: {
      departmentId_name: { departmentId: deptEng.id, name: "BLDC Platform" },
    },
    create: {
      name: "BLDC Platform",
      departmentId: deptEng.id,
      managerId: mgr2.id,
    },
    update: { managerId: mgr2.id },
  });

  const linkUser = async (email, data) => {
    await prisma.user.update({ where: { email }, data });
  };

  await linkUser("hr.admin@atomberg.com", {
    departmentId: deptHr.id,
    department: "People & HR",
  });
  await linkUser("vikram.singh@atomberg.com", {
    departmentId: deptSales.id,
    teamId: teamSales.id,
    department: "Sales & Distribution",
  });
  await linkUser("neha.kapoor@atomberg.com", {
    departmentId: deptEng.id,
    teamId: teamEng.id,
    department: "Product Engineering",
  });
  for (const email of [
    "priya.sharma@atomberg.com",
    "amit.gupta@atomberg.com",
    "arjun.das@atomberg.com",
  ]) {
    await linkUser(email, {
      departmentId: deptSales.id,
      teamId: teamSales.id,
      department: "Sales & Distribution",
    });
  }
  for (const email of ["deepak.raj@atomberg.com", "kavya.menon@atomberg.com"]) {
    await linkUser(email, {
      departmentId: deptEng.id,
      teamId: teamEng.id,
      department: "Product Engineering",
    });
  }

  const orgChannel = await prisma.channel.upsert({
    where: { id: "seed-channel-org" },
    create: {
      id: "seed-channel-org",
      name: "Atomberg — All Hands",
      type: "ORG_WIDE",
    },
    update: { name: "Atomberg — All Hands" },
  });

  const salesDeptChannel = await prisma.channel.upsert({
    where: { id: "seed-channel-sales-dept" },
    create: {
      id: "seed-channel-sales-dept",
      name: "Sales & Distribution",
      type: "DEPT_WIDE",
      departmentId: deptSales.id,
    },
    update: {},
  });

  const salesTeamChannel = await prisma.channel.upsert({
    where: { id: "seed-channel-sales-team" },
    create: {
      id: "seed-channel-sales-team",
      name: "North India Sales Team",
      type: "TEAM_WIDE",
      teamId: teamSales.id,
      departmentId: deptSales.id,
    },
    update: { name: "North India Sales Team" },
  });

  const allUsers = await prisma.user.findMany();
  for (const u of allUsers) {
    await prisma.channelMember.upsert({
      where: {
        channelId_userId: { channelId: orgChannel.id, userId: u.id },
      },
      create: { channelId: orgChannel.id, userId: u.id },
      update: {},
    });
    if (u.departmentId === deptSales.id) {
      await prisma.channelMember.upsert({
        where: {
          channelId_userId: { channelId: salesDeptChannel.id, userId: u.id },
        },
        create: { channelId: salesDeptChannel.id, userId: u.id },
        update: {},
      });
    }
    if (u.teamId === teamSales.id) {
      await prisma.channelMember.upsert({
        where: {
          channelId_userId: { channelId: salesTeamChannel.id, userId: u.id },
        },
        create: { channelId: salesTeamChannel.id, userId: u.id },
        update: {},
      });
    }
  }

  await prisma.message.upsert({
    where: { id: "seed-msg-welcome" },
    create: {
      id: "seed-msg-welcome",
      channelId: salesTeamChannel.id,
      senderId: mgr1.id,
      content:
        "North India team — share daily retail activations & Magnus BLDC pipeline updates here.",
    },
    update: {},
  });

  await prisma.task.upsert({
    where: { id: "seed-task-demo-1" },
    create: {
      id: "seed-task-demo-1",
      title: "Q1 retail expansion deck — Croma & Vijay Sales",
      description: "Include Magnus & Studio smart fan sell-through targets",
      teamId: teamSales.id,
      assigneeId: emp1.id,
      creatorId: mgr1.id,
      status: "IN_PROGRESS",
      dueDate: new Date(`${year}-07-15`),
      sortOrder: 1,
    },
    update: {},
  });

  await prisma.task.upsert({
    where: { id: "seed-task-demo-2" },
    create: {
      id: "seed-task-demo-2",
      title: "Review Amit's FY goal sheet submission",
      teamId: teamSales.id,
      assigneeId: mgr1.id,
      creatorId: mgr1.id,
      status: "TODO",
      sortOrder: 0,
    },
    update: {},
  });

  await prisma.feedback.upsert({
    where: { id: "seed-feedback-1" },
    create: {
      id: "seed-feedback-1",
      providerId: emp1.id,
      recipientId: mgr1.id,
      type: "UPWARD",
      content:
        "Clear focus on premium retail — helped close 3 Magnus enterprise deals this quarter.",
      rating: 5,
      isAnonymous: false,
    },
    update: {},
  });

  await prisma.feedback.upsert({
    where: { id: "seed-feedback-2" },
    create: {
      id: "seed-feedback-2",
      providerId: mgr1.id,
      recipientId: emp2.id,
      type: "DOWNWARD",
      content:
        "Strong trade outreach; tighten dealer stock replenishment follow-ups next sprint.",
      rating: 4,
      isAnonymous: false,
    },
    update: {},
  });

  const [ta0, ta1, ta2, ta3] = thrustAreas;

  const priyaGoals = [
    {
      id: "seed-priya-revenue",
      thrustAreaId: ta0.id,
      title: "Achieve ₹4.2 Cr North India channel revenue",
      uomType: "NUMERIC_MIN",
      target: 42000000,
      weightage: 30,
      status: "LOCKED",
    },
    {
      id: "seed-priya-retail",
      thrustAreaId: ta0.id,
      title: "15 new retail partner activations (Magnus range)",
      uomType: "NUMERIC_MIN",
      target: 15,
      weightage: 20,
      status: "LOCKED",
    },
    {
      id: "seed-priya-nps",
      thrustAreaId: ta3.id,
      title: "Dealer NPS score 52+",
      uomType: "NUMERIC_MIN",
      target: 52,
      weightage: 20,
      status: "LOCKED",
    },
    {
      id: "seed-priya-stockout",
      thrustAreaId: ta2.id,
      title: "Stock-out rate below 3% on top SKUs",
      uomType: "NUMERIC_MAX",
      target: 3,
      weightage: 15,
      status: "LOCKED",
    },
    {
      id: "seed-priya-cert",
      thrustAreaId: ta3.id,
      title: "Atomberg Sales Excellence certification by Jul 31",
      uomType: "TIMELINE",
      target: 0,
      weightage: 15,
      targetDate: new Date(`${year}-07-31`),
      status: "LOCKED",
    },
  ];

  for (const g of priyaGoals) {
    await prisma.goal.upsert({
      where: { id: g.id },
      create: {
        ...g,
        employeeId: emp1.id,
        cycleId: cycle.id,
        approvedBy: mgr1.id,
        approvedAt: new Date(),
        lockedAt: new Date(),
      },
      update: {},
    });
  }

  const amitGoals = [
    {
      id: "seed-amit-accounts",
      thrustAreaId: ta0.id,
      title: "Onboard 25 premium trade partners for BLDC fans",
      uomType: "NUMERIC_MIN",
      target: 25,
      weightage: 40,
      status: "SUBMITTED",
    },
    {
      id: "seed-amit-csat",
      thrustAreaId: ta3.id,
      title: "Maintain installer CSAT above 4.6",
      uomType: "NUMERIC_MIN",
      target: 4.6,
      weightage: 35,
      status: "SUBMITTED",
    },
    {
      id: "seed-amit-proposal",
      thrustAreaId: ta2.id,
      title: "Warranty claim resolution within 48 hours",
      uomType: "NUMERIC_MAX",
      target: 48,
      weightage: 25,
      status: "SUBMITTED",
    },
  ];

  for (const g of amitGoals) {
    await prisma.goal.upsert({
      where: { id: g.id },
      create: { ...g, employeeId: emp2.id, cycleId: cycle.id },
      update: {},
    });
  }

  const priyaLockedGoals = await prisma.goal.findMany({
    where: { employeeId: emp1.id, cycleId: cycle.id, status: "LOCKED" },
  });

  const achievementData = [
    { actualValue: 38000000, status: "ON_TRACK", notes: "Strong Magnus sell-through in NCR" },
    { actualValue: 11, status: "ON_TRACK", notes: "11 retail activations completed" },
    { actualValue: 50, status: "ON_TRACK", notes: "Dealer NPS at 50" },
    { actualValue: 2.8, status: "ON_TRACK", notes: "Stock-outs improving" },
    { actualValue: 0, status: "ON_TRACK", notes: "Certification exam booked" },
  ];

  for (let i = 0; i < priyaLockedGoals.length; i++) {
    const g = priyaLockedGoals[i];
    const a = achievementData[i];
    if (!a) continue;
    await prisma.achievement.upsert({
      where: {
        goalId_cycleId: { goalId: g.id, cycleId: q1Cycle.id },
      },
      create: {
        goalId: g.id,
        cycleId: q1Cycle.id,
        ...a,
        computedScore: 0.84,
      },
      update: {},
    });
  }

  console.log("\n✅ Seed complete — Atomberg demo ready");
  console.log("   Password (all users): demo1234");
  console.log("   Employee: priya.sharma@atomberg.com");
  console.log("   Manager:  vikram.singh@atomberg.com");
  console.log("   Admin:    hr.admin@atomberg.com");
  console.log("\n   BRD calendar: May goals · Jul Q1 · Oct Q2 · Jan Q3 · Mar–Apr Q4");
  console.log("   For hosted demo anytime: set CYCLE_DEMO_OPEN=true\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
