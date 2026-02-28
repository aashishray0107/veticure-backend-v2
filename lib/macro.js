export function calculateMacros(
  final_calories,
  life_stage,
  goal,
  engineData
) {

  let profileKey;

// Decide which profile to use
if (goal === "Fat_Loss") {
  profileKey = "Fat_Loss_Priority";
} else if (goal === "Weight_Gain") {
  profileKey = "Weight_Gain_Priority";
} else if (goal === "Muscle_Gain") {
  profileKey = "Muscle_Build";
} else {
  profileKey = "Maintenance";
}

// Get profile from JSON
const profile =
  engineData.Macronutrient_Ratio_Profiles[profileKey];

if (!profile) {
  throw new Error("Macro profile not found in JSON");
}

// Extract ratios
const proteinRatio = profile.Protein;
const fatRatio = profile.Fat;
const carbRatio = profile.Carbs;

  // 1️⃣ Base ratios by life stage
  if (life_stage === "Puppy") {
  proteinRatio = 0.30;
  fatRatio = 0.20;
  carbRatio = 0.50;
} else if (life_stage === "Senior") {
  proteinRatio = 0.28;
  fatRatio = 0.18;
  carbRatio = 0.54;
} else {
  proteinRatio = 0.28;
  fatRatio = 0.18;
  carbRatio = 0.54;
}

if (goal === "Fat_Loss") {
  proteinRatio = profile.Protein;
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