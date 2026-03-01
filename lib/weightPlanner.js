export function generateWeightPlan(
  current_weight,
  ideal_weight,
  final_bcs_category
) {

  if (!current_weight || !ideal_weight) {
    throw new Error("WeightPlanner: Missing weight inputs");
  }

  let target_weight = ideal_weight;
  let weekly_change_percent = 0;
  let weekly_change_kg = 0;
  let estimated_weeks = 0;
  let plan_type = "Maintain";

  const weight_difference =
    target_weight - current_weight;

  // UNDERWEIGHT → Gain
  if (
    final_bcs_category === "Underweight" ||
    final_bcs_category === "Severe_Underweight"
  ) {

    plan_type = "Weight_Gain";

    weekly_change_percent = 0.0125; // 1.25%

    weekly_change_kg =
      current_weight * weekly_change_percent;

    estimated_weeks =
      Math.ceil(
        Math.abs(weight_difference) /
        weekly_change_kg
      );
  }

  // OVERWEIGHT → Loss
  else if (
    final_bcs_category === "Overweight" ||
    final_bcs_category === "Obese"
  ) {

    plan_type = "Weight_Loss";

    weekly_change_percent = 0.015; // 1.5%

    weekly_change_kg =
      current_weight * weekly_change_percent;

    estimated_weeks =
      Math.ceil(
        Math.abs(weight_difference) /
        weekly_change_kg
      );
  }

  // IDEAL → Maintain
  else {
    plan_type = "Maintain";
    weekly_change_percent = 0;
    weekly_change_kg = 0;
    estimated_weeks = 0;
  }

  return {
    plan_type,
    current_weight,
    target_weight:
      Number(target_weight.toFixed(2)),
    weight_difference:
      Number(weight_difference.toFixed(2)),
    weekly_change_percent:
      weekly_change_percent * 100,
    weekly_change_kg:
      Number(weekly_change_kg.toFixed(2)),
    estimated_duration_weeks:
      estimated_weeks
  };
}