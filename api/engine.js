import { computeBCS } from "../lib/bcs.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { evaluateLifecycle } from "../lib/lifecycle.js";
import { calculateCalories } from "../lib/calories.js";
import { calculateMacros } from "../lib/macro.js";
import { allocateIngredients } from "../lib/allocation.js";
import { validateMinerals } from "../lib/mineral.js";
import { calculateQuestionnaireBCS } from "../lib/bcsEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const {
    breed,
    age_months,
    weight_kg,
    goal,
    activity_level,
    gender,
    bcs_answers
  } = req.body;

  if (!breed || !age_months || !weight_kg || !goal) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {

    // 🔹 Load Breed JSON
    const dataPath = path.join(__dirname, "../data/labrador_engine.json");
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const engineData = JSON.parse(rawData);

    const foodDB =
      engineData?.Food_Composition_Database?.Ingredients;

    // 🔹 Lifecycle (age + weight deviation only)
    const lifecycleReport = evaluateLifecycle(
      age_months,
      weight_kg,
      gender || "Male",
      engineData
    );

    const bcsReport = computeBCS(
  lifecycleReport.deviation_bcs,
  bcsReport.final_bcs_category,
  req.body.bcs_answers,
  engineData
);

    // 🔥 BCS Fusion Layer

    const deviationBCS =
      lifecycleReport.deviation_bcs;

    const questionnaireBCS =
      calculateQuestionnaireBCS(
        bcs_answers,
        engineData
      );

    let finalBCS = deviationBCS;

    const fusion =
      engineData?.BCS_Automatic_Detection_Logic
        ?.BCS_Questionnaire_Logic
        ?.Fusion_Model;

    if (
      questionnaireBCS !== null &&
      fusion
    ) {
      finalBCS =
        (deviationBCS * fusion.Deviation_Component_Weight) +
        (questionnaireBCS * fusion.Questionnaire_Component_Weight);
    }

    finalBCS = Math.round(finalBCS);

    // 🔹 Map Final BCS → Category (clinical 1–9 logic)
    let finalCategory;

    if (finalBCS <= 3) finalCategory = "Underweight";
    else if (finalBCS <= 5) finalCategory = "Ideal";
    else if (finalBCS <= 7) finalCategory = "Overweight";
    else finalCategory = "Obese";

    // 🔹 Calorie Engine (uses fused category)
    const calorieReport = calculateCalories(
      weight_kg,
      activity_level || "Moderate_Activity",
      goal,
      finalCategory,
      lifecycleReport.life_stage,
      age_months,
      engineData
    );

    // 🔹 Macro Engine
    const macroReport = calculateMacros(
      calorieReport.final_calories,
      lifecycleReport.life_stage,
      goal,
      engineData
    );

    // 🔹 Allocation
    const allocationReport = allocateIngredients(
      macroReport,
      lifecycleReport.life_stage
    );

    // 🔹 Mineral Validation
    const mineralReport = validateMinerals(
      lifecycleReport.life_stage,
      calorieReport.final_calories,
      allocationReport,
      foodDB
    );

    return res.status(200).json({

      input: req.body,

      lifecycle_report: lifecycleReport,

      bcs_report: {
        deviation_bcs: deviationBCS,
        questionnaire_bcs: questionnaireBCS,
        final_bcs_score: finalBCS,
        final_bcs_category: finalCategory
      },

      calorie_report: calorieReport,
      macro_report: macroReport,
      allocation_report: allocationReport,
      mineral_report: mineralReport

    });

  } catch (err) {

    return res.status(500).json({
      error: "Engine crashed",
      details: err.message
    });
  }
}