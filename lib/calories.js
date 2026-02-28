export function calculateCalories(
  weight_kg,
  activity_level,
  goal,
  bcs_category,
  life_stage,
  age_months,
  engineData
) {

  // 1️⃣ RER
  const rer = 70 * Math.pow(weight_kg, 0.75);

  // 2️⃣ Activity multiplier
  let activityMultiplier;

  if (activity_level === "Low") {
    activityMultiplier = 1.2;
  } else if (activity_level === "Moderate") {
    activityMultiplier = 1.4;
  } else if (activity_level === "High") {
    activityMultiplier = 1.6;
  } else {
    activityMultiplier = 1.4;
  }

  let calories = rer * activityMultiplier;

  // 3️⃣ Goal adjustment
  if (goal === "Fat_Loss") {
    calories *= 0.85;
  }

  if (goal === "Weight_Gain") {
    calories *= 1.15;
  }

  // 4️⃣ BCS override
  if (bcs_category === "Obese") {
    calories *= 0.80;
  }

  if (bcs_category === "Severely_Underweight") {
    calories *= 1.20;
  }

  // 5️⃣ Senior slowdown (NEW)
  if (life_stage === "Senior") {
    calories *= 0.85;   // 15% reduction for senior
  }

  return {
    rer: Math.round(rer),
    activity_multiplier: activityMultiplier,
    final_calories: Math.round(calories)
  };
}