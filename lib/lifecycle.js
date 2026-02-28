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

  // 1️⃣ Get ideal weight from JSON
  const ideal_weight =
    gender === "Female"
      ? engineData?.Weight_Profile?.Ideal_Adult_Female_kg
      : engineData?.Weight_Profile?.Ideal_Adult_Male_kg;

  // 2️⃣ Calculate deviation
  const deviation =
    ((weight_kg - ideal_weight) / ideal_weight) * 100;

  // 3️⃣ Determine BCS category dynamically
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