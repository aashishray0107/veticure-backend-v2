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

  for (const stage of stages) {

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

    else if (stage.min_age_weeks !== undefined) {

      if (
        ageWeeks >= stage.min_age_weeks &&
        ageWeeks < stage.max_age_weeks
      ) {
        matchedStage = stage;
        break;
      }
    }

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

  // Ideal Weight
  let weightRange = null;

  if (matchedStage.Male_Ideal_Weight_Range_kg) {
    weightRange =
      normalizedGender === "Female"
        ? matchedStage.Female_Ideal_Weight_Range_kg
        : matchedStage.Male_Ideal_Weight_Range_kg;
  }

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

  const deviationPercent =
    ((weight_kg - ideal_weight) / ideal_weight) * 100;

  const deviationDecimal =
    deviationPercent / 100;

  // 🔥 Risk Layer
  let risk_level = "No_Risk";
  let risk_note = null;

  const riskModel =
    engineData?.Risk_Assessment_Model;

  if (riskModel) {

    if (deviationDecimal < -0.05) {

      const uw = riskModel.Underweight;

      if (uw?.severe && deviationDecimal <= uw.severe.max) {
        risk_level = uw.severe.risk;
        risk_note = "Severe undernutrition risk";
      }
      else if (
        uw?.moderate &&
        deviationDecimal >= uw.moderate.min &&
        deviationDecimal <= uw.moderate.max
      ) {
        risk_level = uw.moderate.risk;
        risk_note = "Moderate underweight risk";
      }
      else if (
        uw?.mild &&
        deviationDecimal >= uw.mild.min &&
        deviationDecimal <= uw.mild.max
      ) {
        risk_level = uw.mild.risk;
        risk_note = "Mild underweight risk";
      }
    }

    else if (deviationDecimal > 0.05) {

      const ow = riskModel.Overweight;

      if (ow?.severe && deviationDecimal >= ow.severe.min) {
        risk_level = ow.severe.risk;
        risk_note = "Severe obesity risk";
      }
      else if (
        ow?.moderate &&
        deviationDecimal >= ow.moderate.min &&
        deviationDecimal <= ow.moderate.max
      ) {
        risk_level = ow.moderate.risk;
        risk_note = "Moderate overweight risk";
      }
      else if (
        ow?.mild &&
        deviationDecimal >= ow.mild.min &&
        deviationDecimal <= ow.mild.max
      ) {
        risk_level = ow.mild.risk;
        risk_note = "Mild overweight risk";
      }
    }
  }

  // 🔥 Deviation → Category
  const deviationModel =
    engineData?.BCS_Automatic_Detection_Logic
      ?.Deviation_Thresholds;

  if (!deviationModel) {
    throw new Error("Deviation_Thresholds missing in JSON");
  }

  let deviationCategory = null;

  for (const category in deviationModel) {

    const rule = deviationModel[category];

    const min = rule.Min_Deviation_Decimal;
    const max = rule.Max_Deviation_Decimal;

    if (min !== undefined && max !== undefined) {
      if (deviationDecimal >= min && deviationDecimal <= max) {
        deviationCategory = category;
        break;
      }
    }
    else if (min !== undefined) {
      if (deviationDecimal >= min) {
        deviationCategory = category;
        break;
      }
    }
    else if (max !== undefined) {
      if (deviationDecimal <= max) {
        deviationCategory = category;
        break;
      }
    }
  }

  if (!deviationCategory) {
    throw new Error("Deviation category could not be resolved");
  }

  const estimateMap =
    engineData?.BCS_Automatic_Detection_Logic
      ?.Deviation_To_BCS_Estimate;

  if (!estimateMap?.[deviationCategory]) {
    throw new Error("Deviation_To_BCS_Estimate missing for category");
  }

  const minBCS =
    estimateMap[deviationCategory].min_bcs;

  const maxBCS =
    estimateMap[deviationCategory].max_bcs;

  const deviationBCS =
    (minBCS + maxBCS) / 2;

  return {
    life_stage:
      matchedStage.Stage_Name ||
      matchedStage.label ||
      "Unknown",

    ideal_weight:
      Number(ideal_weight.toFixed(2)),

    weight_deviation_percent:
      Math.round(deviationPercent),

    deviation_bcs: deviationBCS,
    deviation_category: deviationCategory,

    risk_level,
    risk_note
  };
}