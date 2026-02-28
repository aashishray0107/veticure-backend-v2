export function calculateCalories(
  weight_kg,
  activity_level,
  goal,
  bcs_category,
  life_stage,
  age_months,
  engineData,
  symptoms = []
) {

  // 1️⃣ RER
  const rer = 70 * Math.pow(weight_kg, 0.75);

  // 2️⃣ MER (Life stage based)
  const merMultiplier =
    engineData.Energy_System.MER_Multipliers[life_stage] || 1.6;

  const baseCalories = rer * merMultiplier;

  // 3️⃣ Activity Adjustment
  const activityAdj =
    engineData.Activity_Based_Nutrition_Adjustment
      .Calorie_Adjustment_By_Activity_Level[activity_level] || 0;

  // 4️⃣ Weight Condition Adjustment
  const weightAdj =
    engineData.Weight_Condition_Adjustment_Engine
      .Calorie_Adjustment_By_BCS[bcs_category] || 0;

  // 5️⃣ Goal Adjustment (optional — if you define separately later)
  let goalAdj = 0;

  if (engineData.Goal_Calorie_Adjustments) {
    goalAdj =
      engineData.Goal_Calorie_Adjustments[goal] || 0;
  }

  // 6️⃣ Symptom Adjustment
  let symptomAdj = 0;

  if (Array.isArray(symptoms)) {
    symptoms.forEach(symptom => {
      const adj =
        engineData.Symptom_Based_Nutrition_Logic
          ?.Calorie_Modifier?.[symptom] || 0;
      symptomAdj += adj;
    });
  }

  // 7️⃣ Seasonal Adjustment
  const seasonalAdj =
    engineData.Seasonal_Adjustment
      ?.Calorie_Modifier_By_Season?.Default || 0;

  // 8️⃣ Total Adjustment
  let totalAdjustment =
    activityAdj + weightAdj + goalAdj + symptomAdj + seasonalAdj;

  // 9️⃣ Clamp using Global Cap
  const maxReduction =
    engineData.Global_Adjustment_Cap
      .Maximum_Total_Reduction_Percentage;

  const maxIncrease =
    engineData.Global_Adjustment_Cap
      .Maximum_Total_Increase_Percentage;

  if (totalAdjustment < maxReduction)
    totalAdjustment = maxReduction;

  if (totalAdjustment > maxIncrease)
    totalAdjustment = maxIncrease;

  // 10️⃣ Apply Adjustment
  let finalCalories =
    baseCalories * (1 + totalAdjustment);

  // 11️⃣ Absolute Safety Limits
  const minCalories =
    engineData.Absolute_Calorie_Safety_Limits
      .Minimum_Calories_Per_Kg_Bodyweight
      * weight_kg;

  const maxCalories =
    engineData.Absolute_Calorie_Safety_Limits
      .Maximum_Calories_Per_Kg_Bodyweight
      * weight_kg;

  if (finalCalories < minCalories)
    finalCalories = minCalories;

  if (finalCalories > maxCalories)
    finalCalories = maxCalories;

  return {
    rer: Math.round(rer),
    mer_multiplier: merMultiplier,
    total_adjustment_decimal:
      Number(totalAdjustment.toFixed(3)),
    final_calories:
      Math.round(finalCalories)
  };
}