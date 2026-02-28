export function calculateQuestionnaireBCS(
  answers,
  engineData
) {

  const logic =
    engineData?.BCS_Automatic_Detection_Logic
      ?.BCS_Questionnaire_Logic;

  if (!logic || !answers) return null;

  const questions = logic.Questions;
  const scoreMap = logic.Scoring_Rules.Score_To_BCS_Map;

  let totalScore = 0;

  for (const q of questions) {

    const answer = answers[q.Id];

    if (
      answer &&
      q.Options?.[answer] !== undefined
    ) {
      totalScore += q.Options[answer];
    }
  }

  for (const rule of scoreMap) {

    if (
      totalScore >= rule.min_score &&
      totalScore <= rule.max_score
    ) {

      if (typeof rule.bcs_value === "number") {
        return rule.bcs_value;
      }

      if (rule.bcs_value?.min_bcs) {
        return (
          (rule.bcs_value.min_bcs +
           rule.bcs_value.max_bcs) / 2
        );
      }
    }
  }

  return null;
}



export function computeBCS(
  deviation_bcs,
  deviation_category,
  answers,
  engineData
) {

  const model =
    engineData?.BCS_Automatic_Detection_Logic;

  if (!model)
    throw new Error("BCS_Automatic_Detection_Logic missing");

  const fusion =
    model.BCS_Questionnaire_Logic?.Fusion_Model;

  if (!fusion)
    throw new Error("Fusion_Model missing in JSON");

  const questionnaire_bcs =
    calculateQuestionnaireBCS(
      answers,
      engineData
    );

  let finalRaw = deviation_bcs;

  if (questionnaire_bcs !== null) {

    finalRaw =
      (deviation_bcs *
       fusion.Deviation_Component_Weight)
      +
      (questionnaire_bcs *
       fusion.Questionnaire_Component_Weight);
  }

  let finalScore =
    Math.round(finalRaw);

  // Higher Risk Override
  if (
    fusion.higher_risk_override_if_conflict
  ) {

    if (
      questionnaire_bcs !== null &&
      questionnaire_bcs > finalScore
    ) {
      finalScore = questionnaire_bcs;
    }

    if (deviation_bcs > finalScore) {
      finalScore = deviation_bcs;
    }
  }

  // Clamp safety
  if (finalScore < 1) finalScore = 1;
  if (finalScore > 9) finalScore = 9;

  let finalCategory = "Ideal";

  if (finalScore <= 3)
    finalCategory = "Underweight";
  else if (finalScore <= 5)
    finalCategory = "Ideal";
  else if (finalScore <= 7)
    finalCategory = "Overweight";
  else
    finalCategory = "Obese";

  return {
    deviation_bcs,
    questionnaire_bcs,
    final_bcs_score: finalScore,
    final_bcs_category: finalCategory
  };
}