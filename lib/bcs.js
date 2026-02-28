export function computeBCS(
  deviation_bcs,
  deviation_category,
  bcs_answers,
  engineData
) {

  const bcsLogic =
    engineData?.BCS_Automatic_Detection_Logic;

  if (!bcsLogic)
    throw new Error("BCS_Automatic_Detection_Logic missing in JSON");

  const questionnaireLogic =
    bcsLogic?.BCS_Questionnaire_Logic;

  if (!questionnaireLogic)
    throw new Error("BCS_Questionnaire_Logic missing in JSON");

  // -------------------------
  // 1️⃣ Questionnaire Scoring
  // -------------------------

  let totalScore = 0;

  const questions = questionnaireLogic.Questions;

  for (const question of questions) {

    const answerKey =
      bcs_answers?.[question.Id];

    if (!answerKey)
      continue;

    const optionScore =
      question.Options?.[answerKey];

    if (optionScore !== undefined)
      totalScore += optionScore;
  }

  // Map score → BCS
  let questionnaire_bcs = null;

  const scoreMap =
    questionnaireLogic.Scoring_Rules.Score_To_BCS_Map;

  for (const rule of scoreMap) {

    if (
      totalScore >= rule.min_score &&
      totalScore <= rule.max_score
    ) {

      if (typeof rule.bcs_value === "number") {
        questionnaire_bcs = rule.bcs_value;
      }

      else if (typeof rule.bcs_value === "object") {
        const min = rule.bcs_value.min_bcs;
        const max = rule.bcs_value.max_bcs;
        questionnaire_bcs = (min + max) / 2;
      }

      break;
    }
  }

  // If no answers provided → fallback
  if (questionnaire_bcs === null) {
    questionnaire_bcs = deviation_bcs;
  }

  // -------------------------
  // 2️⃣ Fusion Model
  // -------------------------

  const fusion =
    questionnaireLogic.Fusion_Model;

  const devWeight =
    fusion.Deviation_Component_Weight;

  const quesWeight =
    fusion.Questionnaire_Component_Weight;

  let finalRaw =
    (deviation_bcs * devWeight) +
    (questionnaire_bcs * quesWeight);

  let final_bcs_score =
    Math.round(finalRaw);

  // -------------------------
  // 3️⃣ Higher Risk Override
  // -------------------------

  if (fusion.higher_risk_override_if_conflict) {

    const maxComponent =
      Math.max(
        Math.round(deviation_bcs),
        Math.round(questionnaire_bcs)
      );

    if (maxComponent > final_bcs_score)
      final_bcs_score = maxComponent;
  }

  // -------------------------
  // 4️⃣ Category Mapping
  // -------------------------

  let final_bcs_category;

  if (final_bcs_score <= 3)
    final_bcs_category = "Underweight";
  else if (final_bcs_score <= 5)
    final_bcs_category = "Ideal";
  else if (final_bcs_score <= 7)
    final_bcs_category = "Overweight";
  else
    final_bcs_category = "Obese";

  return {
    deviation_bcs,
    questionnaire_bcs,
    final_bcs_score,
    final_bcs_category
  };
}