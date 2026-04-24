import { scryptSync } from "node:crypto";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@mealtracker.local";
const DEMO_PASSWORD = "DemoTracker123!";

function buildSeedPasswordHash(password) {
  const salt = "meal-tracker-demo-seed";
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

async function main() {
  const demoUser = await prisma.user.upsert({
    where: {
      email: DEMO_EMAIL,
    },
    update: {
      name: "Demo User",
      passwordHash: buildSeedPasswordHash(DEMO_PASSWORD),
    },
    create: {
      email: DEMO_EMAIL,
      name: "Demo User",
      passwordHash: buildSeedPasswordHash(DEMO_PASSWORD),
    },
  });

  await prisma.userSettings.upsert({
    where: {
      userId: demoUser.id,
    },
    update: {},
    create: {
      userId: demoUser.id,
      dailyCalories: 1700,
      proteinTargetG: 180,
      carbTargetMinG: 70,
      carbTargetMaxG: 100,
      fatTargetMinG: 55,
      fatTargetMaxG: 65,
    },
  });

  const existingCount = await prisma.mealLog.count({
    where: {
      userId: demoUser.id,
    },
  });
  const existingSupplementCount = await prisma.supplementLog.count({
    where: {
      userId: demoUser.id,
    },
  });

  const now = new Date();

  const breakfastAssumptions = [
    "Assumed 250 g nonfat Greek yogurt with 40 g oats.",
    "Used a medium banana and a small handful of berries.",
    "No added honey or nut butter was included.",
  ];

  const breakfastMicronutrients = {
    sugarG: 28,
    fiberG: 8,
    sodiumMg: 95,
    potassiumMg: 860,
    calciumMg: 345,
    ironMg: 2.6,
    zincMg: 1.9,
    vitaminCMg: 26,
    vitaminAMcg: 82,
    vitaminDMcg: 0.3,
    vitaminB12Mcg: 1.1,
  };

  const lunchAssumptions = [
    "Assumed 180 g cooked chicken breast.",
    "Assumed 150 g cooked rice and 1 tsp olive oil.",
    "Vegetables were treated as lightly cooked with minimal sauce.",
  ];

  const lunchMicronutrients = {
    sugarG: 2.4,
    fiberG: 4.6,
    sodiumMg: 145,
    potassiumMg: 940,
    calciumMg: 78,
    ironMg: 2.2,
    zincMg: 1.8,
    vitaminCMg: 79,
    vitaminAMcg: 58,
    vitaminDMcg: 0.2,
    vitaminB12Mcg: 0.5,
  };

  if (existingCount === 0) {
    await prisma.mealLog.createMany({
      data: [
        {
          userId: demoUser.id,
          mealType: "BREAKFAST",
          description: "Greek yogurt, oats, banana, berries",
          mealName: "Greek Yogurt Oat Bowl",
          estimatedCalories: 430,
          proteinG: 34,
          carbsG: 54,
          fatG: 7,
          micronutrientsJson: JSON.stringify(breakfastMicronutrients),
          confidenceScore: 0.8,
          confidenceLabel: "high",
          assumptionsJson: JSON.stringify(breakfastAssumptions),
          estimatedComponentsJson: JSON.stringify([
            {
              name: "Greek yogurt",
              estimatedAmount: "250 g",
              calories: 145,
              proteinG: 26,
              carbsG: 10,
              fatG: 0,
              notes: "Nonfat plain yogurt.",
            },
            {
              name: "Oats",
              estimatedAmount: "40 g",
              calories: 155,
              proteinG: 5,
              carbsG: 27,
              fatG: 3,
              notes: "Dry rolled oats.",
            },
            {
              name: "Banana and berries",
              estimatedAmount: "1 medium banana + 60 g berries",
              calories: 130,
              proteinG: 3,
              carbsG: 17,
              fatG: 4,
              notes: "Fruit estimate rounded.",
            },
          ]),
          analysisSource: "seed",
          analysisModel: "seed-data",
          consumedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 15, 0),
        },
        {
          userId: demoUser.id,
          mealType: "LUNCH",
          description: "Chicken breast, rice, broccoli, 1 tsp olive oil",
          mealName: "Chicken Rice Plate",
          estimatedCalories: 565,
          proteinG: 58,
          carbsG: 42,
          fatG: 14,
          micronutrientsJson: JSON.stringify(lunchMicronutrients),
          confidenceScore: 0.77,
          confidenceLabel: "medium",
          assumptionsJson: JSON.stringify(lunchAssumptions),
          estimatedComponentsJson: JSON.stringify([
            {
              name: "Chicken breast",
              estimatedAmount: "180 g cooked",
              calories: 300,
              proteinG: 54,
              carbsG: 0,
              fatG: 7,
              notes: "Skinless grilled chicken.",
            },
            {
              name: "Cooked rice",
              estimatedAmount: "150 g",
              calories: 190,
              proteinG: 4,
              carbsG: 41,
              fatG: 1,
              notes: "White rice, cooked.",
            },
            {
              name: "Broccoli with olive oil",
              estimatedAmount: "100 g broccoli + 1 tsp oil",
              calories: 75,
              proteinG: 0,
              carbsG: 1,
              fatG: 6,
              notes: "Oil added conservatively.",
            },
          ]),
          analysisSource: "seed",
          analysisModel: "seed-data",
          consumedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0),
        },
      ],
    });
  }

  if (existingSupplementCount === 0) {
    await prisma.supplementLog.createMany({
      data: [
        {
          userId: demoUser.id,
          supplementKey: "VITAMIN_D",
          supplementLabel: "Vitamin D",
          amountValue: 25,
          amountUnit: "MCG",
          micronutrientsJson: JSON.stringify({
            vitaminDMcg: 25,
            zincMg: 0,
          }),
          creatineG: 0,
          note: "Seeded demo supplement entry.",
          consumedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 30, 0),
        },
        {
          userId: demoUser.id,
          supplementKey: "CREATINE",
          supplementLabel: "Creatine",
          amountValue: 5,
          amountUnit: "G",
          micronutrientsJson: JSON.stringify({
            zincMg: 0,
          }),
          creatineG: 5,
          note: "Seeded demo supplement entry.",
          consumedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 35, 0),
        },
      ],
    });
  }
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
