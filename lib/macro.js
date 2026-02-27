export function calculateMacros(final_calories, life_stage, goal) {

  let proteinRatio;
  let fatRatio;
  let carbRatio;

  // Base ratios
  if (life_stage === "Puppy") {
    proteinRatio = 0.30;
    fatRatio = 0.20;
    carbRatio = 0.50;
  } else {
    proteinRatio = 0.28;
    fatRatio = 0.18;
    carbRatio = 0.54;
  }

  // Goal adjustment
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

  const proteinCalories = final_calories * proteinRatio;
  const fatCalories = final_calories * fatRatio;
  const carbCalories = final_calories * carbRatio;

  const protein_g = proteinCalories / 4;
  const fat_g = fatCalories / 9;
  const carbs_g = carbCalories / 4;

  return {
    protein_g: Math.round(protein_g),
    fat_g: Math.round(fat_g),
    carbs_g: Math.round(carbs_g)
  };
}