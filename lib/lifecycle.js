export function evaluateLifecycle(
  age_months,
  weight_kg,
  gender,
  engineData
) {

  if (!engineData?.Lifecycle_Growth_Model_20_Stages) {
    throw new Error("Lifecycle_Growth_Model_20_Stages missing in JSON");
  }

  const stages = engineData.Lifecycle_Growth_Model_20_Stages;

  const normalizedGender =
    gender?.toLowerCase() === "female" ? "Female" : "Male";

  const ageWeeks = age_months * 4.345;
  const ageYears = age_months / 12;

  let matchedStage = null;

  // 🔎 Stage Detection (weeks + months + years)
  for (const stage of stages) {

    // --- MONTH BASED ---
    if (stage.min_age_months !== undefined) {

      const min = stage.min_age_months;
      const max = stage.max_age_months;

      if (max === null) {
        if (age_months >= min) {
          matchedStage = stage;
          break;
        }
      } else if (age_months >= min && age_months < max) {
        matchedStage = stage;
        break;
      }
    }

    // --- WEEK BASED ---
    else if (stage.min_age_weeks !== undefined) {

      const min = stage.min_age_weeks;
      const max = stage.max_age_weeks;

      if (ageWeeks >= min && ageWeeks < max) {
        matchedStage = stage;
        break;
      }
    }

    // --- YEAR BASED ---
    else if (stage.min_age_years !== undefined) {

      const min = stage.min_age_years;
      const max = stage.max_age_years;

      if (max === null) {
        if (ageYears >= min) {
          matchedStage = stage;
          break;
        }
      } else if (ageYears >= min && ageYears < max) {
        matchedStage = stage;
        break;
      }
    }
  }

  if (!matchedStage) {
    throw new Error("No lifecycle stage matched for age");
  }

  // 🧠 Extract Ideal Weight Range
  let weightRange = null;

  // Growth stages schema
  if (matchedStage.Male_Ideal_Weight_Range_kg) {

    weightRange =
      normalizedGender === "Female"
        ? matchedStage.Female_Ideal_Weight_Range_kg
        : matchedStage.Male_Ideal_Weight_Range_kg;
  }

  // Adult stages schema (data block)
  else if (matchedStage.data) {

    weightRange =
      normalizedGender === "Female"
        ? matchedStage.data.Female_kg
        : matchedStage.data.Male_kg;
  }

  if (!weightRange || weightRange.length !== 2) {
    throw new Error("Ideal weight range missing for stage");
  }

  const ideal_weight =
    (weightRange[0] + weightRange[1]) / 2;

  const deviation =
    ((weight_kg - ideal_weight) / ideal_weight) * 100;

  // 🧮 BCS Classification (can be JSON-driven later)
  // Convert percent → decimal for JSON comparison
const deviationDecimal = deviation / 100;

const deviationModel =
  engineData?.BCS_Automatic_Detection_Logic?.Deviation_Thresholds;

if (!deviationModel) {
  throw new Error("Deviation_Thresholds missing in JSON");
}

let bcs_category = null;

for (const category in deviationModel) {

  const rule = deviationModel[category];

  const min = rule.Min_Deviation_Decimal;
  const max = rule.Max_Deviation_Decimal;

  if (min !== undefined && max !== undefined) {
    if (deviationDecimal >= min && deviationDecimal <= max) {
      bcs_category = category;
      break;
    }
  }

  else if (min !== undefined) {
    if (deviationDecimal >= min) {
      bcs_category = category;
      break;
    }
  }

  else if (max !== undefined) {
    if (deviationDecimal <= max) {
      bcs_category = category;
      break;
    }
  }
}

if (!bcs_category) {
  bcs_category = "Ideal"; // fallback safety
}

  return {
    life_stage:
      matchedStage.Stage_Name ||
      matchedStage.label ||
      "Unknown",

    ideal_weight:
      Number(ideal_weight.toFixed(2)),

    weight_deviation_percent:
      Math.round(deviation),

    bcs_category
  };
}