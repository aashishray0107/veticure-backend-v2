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

  // 1️⃣ RER (biological constant – acceptable hardcoded formula)
  const rer = 70 * Math.pow(weight_kg, 0.75);

  // 2️⃣ MER (life stage multiplier from JSON)
  const lifecycleMap =
  engineData?.Energy_System?.Lifecycle_to_MER_Map;

const merKey = lifecycleMap?.[life_stage] || "Adult_Neutered";

const merMultiplier =
  engineData?.Energy_System?.MER_Multipliers?.[merKey] ?? 1.6;

  const baseCalories = rer * merMultiplier;

  // 3️⃣ Activity Adjustment (matches your JSON structure)
  const activityAdj =
    engineData?.Activity_Based_Nutrition_Adjustment
      ?. [activity_level]
      ?.Calorie_Adjustment_Percent ?? 0;

  // 4️⃣ Weight Condition Adjustment (BCS)
  const weightAdj =
    engineData?.Weight_Condition_Adjustment_Engine
      ?. [bcs_category]
      ?.Calorie_Delta_Percent ?? 0;

  // 5️⃣ Goal Adjustment (if defined in JSON)
  const goalAdj =
    engineData?.Goal_Calorie_Adjustments?.[goal] ?? 0;

  // 6️⃣ Symptom Adjustment
  let symptomAdj = 0;

  if (Array.isArray(symptoms)) {
    symptoms.forEach(symptom => {
      const adj =
        engineData?.Symptom_Based_Nutrition_Logic
          ?.Calorie_Modifier?.[symptom] ?? 0;
      symptomAdj += adj;
    });
  }

  // 7️⃣ Seasonal Adjustment (default fallback)
  const seasonalAdj =
    engineData?.Seasonal_Adjustment
      ?.Calorie_Modifier_By_Season?.Default ?? 0;

  // 8️⃣ Total Adjustment (additive stacking model)
  let totalAdjustment =
    activityAdj +
    weightAdj +
    goalAdj +
    symptomAdj +
    seasonalAdj;

  // 9️⃣ Clamp using Global_Adjustment_Cap (matches your JSON keys)
  const maxIncrease =
    engineData?.Global_Adjustment_Cap?.Max_Positive_Adjustment ?? 0.35;

  const maxReduction =
    engineData?.Global_Adjustment_Cap?.Max_Negative_Adjustment ?? -0.35;

  if (totalAdjustment > maxIncrease)
    totalAdjustment = maxIncrease;

  if (totalAdjustment < maxReduction)
    totalAdjustment = maxReduction;

  // 🔟 Apply Adjustment
  let finalCalories =
    baseCalories * (1 + totalAdjustment);

  // 1️⃣1️⃣ Absolute Safety Limits (based on RER multipliers in JSON)
  const minCalories = rer * 1.0;
  const maxCalories = rer * 2.5;

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