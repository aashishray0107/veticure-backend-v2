export function calculateMacros(final_calories, life_stage, goal) {

  let proteinRatio;
  let fatRatio;
  let carbRatio;

  // 1️⃣ Base ratios by life stage
  if (life_stage === "Puppy") {
    proteinRatio = 0.30;
    fatRatio = 0.20;
    carbRatio = 0.50;
  } else if (life_stage === "Senior") {
    proteinRatio = 0.28;  // seniors need decent protein
    fatRatio = 0.18;
    carbRatio = 0.54;
  } else {
    // Adult
    proteinRatio = 0.28;
    fatRatio = 0.18;
    carbRatio = 0.54;
  }

  // 2️⃣ Goal override (GOAL WINS)
  if (goal === "Fat_Loss") {
    proteinRatio = 0.35;
    fatRatio = 0.15;
    carbRatio = 0.50;
  }

  if (goal === "Weight_Gain") {
    proteinRatio = 0.30;
    fatRatio = 0.25;
    carbRatio = 0.45;
  }

  // Ensure sum = 1.0
  const total = proteinRatio + fatRatio + carbRatio;
  if (Math.abs(total - 1.0) > 0.01) {
    throw new Error("Macro ratios must sum to 1.0");
  }

  const proteinCalories = final_calories * proteinRatio;
  const fatCalories = final_calories * fatRatio;
  const carbCalories = final_calories * carbRatio;

  return {
    protein_g: Math.round(proteinCalories / 4),
    fat_g: Math.round(fatCalories / 9),
    carbs_g: Math.round(carbCalories / 4)
  };
}