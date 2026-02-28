export function evaluateLifecycle(
  age_months,
  weight_kg,
  gender,
  engineData
) {

  let life_stage;

  if (age_months < 12) {
    life_stage = "Puppy";
  } else if (age_months < 84) {
    life_stage = "Adult";
  } else {
    life_stage = "Senior";
  }

  // Normalize gender input
  const normalizedGender =
    gender?.toLowerCase() === "female" ? "Female" : "Male";

  // ✅ Correct JSON Path (Permanent Fix)
  const ideal_weight =
    normalizedGender === "Female"
      ? engineData?.Breed_Profile?.Weight_Profile?.Ideal_Adult_Female_kg
      : engineData?.Breed_Profile?.Weight_Profile?.Ideal_Adult_Male_kg;

  if (!ideal_weight) {
    throw new Error("Ideal weight not found in JSON structure");
  }

  const deviation =
    ((weight_kg - ideal_weight) / ideal_weight) * 100;

  let bcs_category = "Ideal";

  if (deviation <= -20)
    bcs_category = "Underweight";
  else if (deviation >= 20)
    bcs_category = "Obese";
  else if (deviation >= 10)
    bcs_category = "Overweight";
  else if (deviation <= -10)
    bcs_category = "Underweight";

  return {
    life_stage,
    ideal_weight,
    weight_deviation_percent: Math.round(deviation),
    bcs_category
  };
}