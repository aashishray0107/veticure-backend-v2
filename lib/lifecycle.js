export function evaluateLifecycle(
  age_months,
  weight_kg,
  gender,
  engineData
) {

  const normalizedGender =
    gender?.toLowerCase() === "female" ? "Female" : "Male";

  const stages =
    engineData?.Lifecycle_Growth_Model_20_Stages;

  if (!Array.isArray(stages)) {
    throw new Error("Lifecycle_Growth_Model_20_Stages missing in JSON");
  }

  // 1️⃣ Find correct stage
  let matchedStage = null;

for (const stage of stages) {

  // --- MONTH BASED STAGES ---
  if (stage.min_age_months !== undefined) {

    const min = stage.min_age_months;
    const max = stage.max_age_months;

    // Open-ended stage (like 5+ years)
    if (max === null) {
      if (age_months >= min) {
        matchedStage = stage;
        break;
      }
    }

    // Normal bounded stage
    else if (max !== undefined) {
      if (age_months >= min && age_months < max) {
        matchedStage = stage;
        break;
      }
    }
  }

  // --- WEEK BASED STAGES ---
  else if (stage.min_age_weeks !== undefined) {

    const age_weeks = age_months * 4.345;

    const min = stage.min_age_weeks;
    const max = stage.max_age_weeks;

    if (age_weeks >= min && age_weeks < max) {
      matchedStage = stage;
      break;
    }
  }
}

if (!matchedStage) {
  throw new Error("No lifecycle stage matched for age");
}

  // 2️⃣ Get ideal weight range
  let weightRange;

if (matchedStage.Male_Ideal_Weight_Range_kg) {
  // Puppy / growth stages
  weightRange =
    normalizedGender === "Female"
      ? matchedStage.Female_Ideal_Weight_Range_kg
      : matchedStage.Male_Ideal_Weight_Range_kg;
}
else if (matchedStage.data) {
  // Adult / senior stages
  weightRange =
    normalizedGender === "Female"
      ? matchedStage.data.Female_kg
      : matchedStage.data.Male_kg;
}

if (!weightRange || weightRange.length !== 2) {
  throw new Error("Ideal weight range missing for stage");
}

  if (!weightRange || weightRange.length !== 2) {
    throw new Error("Ideal weight range missing for stage");
  }

  // 3️⃣ Use midpoint of range
  const ideal_weight =
    (weightRange[0] + weightRange[1]) / 2;

  const deviation =
    ((weight_kg - ideal_weight) / ideal_weight) * 100;

  // 4️⃣ Simple deviation bands (we can JSON-drive later)
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
    life_stage: matchedStage.Stage_Name,
    ideal_weight: Number(ideal_weight.toFixed(2)),
    weight_deviation_percent: Math.round(deviation),
    bcs_category
  };
}