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

  // Map total score to BCS
  for (const rule of scoreMap) {

    if (
      totalScore >= rule.min_score &&
      totalScore <= rule.max_score
    ) {

      if (typeof rule.bcs_value === "number") {
        return rule.bcs_value;
      }

      // Range case (8–9)
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