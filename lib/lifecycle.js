export function evaluateLifecycle(age_months, weight_kg) {

  let life_stage;

  if (age_months < 12) {
    life_stage = "Puppy";
  } else if (age_months >= 12 && age_months < 84) {
    life_stage = "Adult";
  } else {
    life_stage = "Senior";
  }

  // Temporary fixed ideal weight for Labrador
  const ideal_weight = 32;

  const deviation = ((weight_kg - ideal_weight) / ideal_weight) * 100;

  let bcs_category;

  if (deviation > 20) {
    bcs_category = "Obese";
  } else if (deviation > 10) {
    bcs_category = "Overweight";
  } else if (deviation < -20) {
    bcs_category = "Severely_Underweight";
  } else if (deviation < -10) {
    bcs_category = "Underweight";
  } else {
    bcs_category = "Normal";
  }

  return {
    life_stage,
    ideal_weight,
    weight_deviation_percent: Math.round(deviation),
    bcs_category
  };
}