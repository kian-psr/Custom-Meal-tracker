import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.userSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      dailyCalories: 1700,
      proteinTargetG: 180,
      carbTargetMinG: 70,
      carbTargetMaxG: 100,
      fatTargetMinG: 55,
      fatTargetMaxG: 65,
    },
  });

  const existingCount = await prisma.mealLog.count();

  if (existingCount > 0) {
    return;
  }

  const now = new Date();

  const breakfastAssumptions = [
    "Assumed 250 g nonfat Greek yogurt with 40 g oats.",
    "Used a medium banana and a small handful of berries.",
    "No added honey or nut butter was included."
  ];

  const lunchAssumptions = [
    "Assumed 180 g cooked chicken breast.",
    "Assumed 150 g cooked rice and 1 tsp olive oil.",
    "Vegetables were treated as lightly cooked with minimal sauce."
  ];

  await prisma.mealLog.createMany({
    data: [
      {
        mealType: "BREAKFAST",
        description: "Greek yogurt, oats, banana, berries",
        mealName: "Greek Yogurt Oat Bowl",
        estimatedCalories: 430,
        proteinG: 34,
        carbsG: 54,
        fatG: 7,
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
            notes: "Nonfat plain yogurt."
          },
          {
            name: "Oats",
            estimatedAmount: "40 g",
            calories: 155,
            proteinG: 5,
            carbsG: 27,
            fatG: 3,
            notes: "Dry rolled oats."
          },
          {
            name: "Banana and berries",
            estimatedAmount: "1 medium banana + 60 g berries",
            calories: 130,
            proteinG: 3,
            carbsG: 17,
            fatG: 4,
            notes: "Fruit estimate rounded."
          }
        ]),
        analysisSource: "seed",
        analysisModel: "seed-data",
        consumedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 15, 0),
      },
      {
        mealType: "LUNCH",
        description: "Chicken breast, rice, broccoli, 1 tsp olive oil",
        mealName: "Chicken Rice Plate",
        estimatedCalories: 565,
        proteinG: 58,
        carbsG: 42,
        fatG: 14,
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
            notes: "Skinless grilled chicken."
          },
          {
            name: "Cooked rice",
            estimatedAmount: "150 g",
            calories: 190,
            proteinG: 4,
            carbsG: 41,
            fatG: 1,
            notes: "White rice, cooked."
          },
          {
            name: "Broccoli with olive oil",
            estimatedAmount: "100 g broccoli + 1 tsp oil",
            calories: 75,
            proteinG: 0,
            carbsG: 1,
            fatG: 6,
            notes: "Oil added conservatively."
          }
        ]),
        analysisSource: "seed",
        analysisModel: "seed-data",
        consumedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0),
      }
    ],
  });
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
