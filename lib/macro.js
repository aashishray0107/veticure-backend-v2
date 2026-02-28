export function calculateMacros(
  final_calories,
  life_stage,
  goal,
  engineData
) {

  let profileKey;

  if (goal === "Fat_Loss") {
    profileKey = "Fat_Loss_Priority";
  } else if (goal === "Weight_Gain") {
    profileKey = "Weight_Gain_Priority";
  } else if (goal === "Muscle_Gain") {
    profileKey = "Muscle_Build";
  } else {
    profileKey = "Maintenance";
  }

  const profile =
    engineData.Macronutrient_Ratio_Profiles[profileKey];

  if (!profile) {
    throw new Error("Macro profile not found in JSON");
  }

  const proteinRatio = profile.Protein;
  const fatRatio = profile.Fat;
  const carbRatio = profile.Carbs;

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