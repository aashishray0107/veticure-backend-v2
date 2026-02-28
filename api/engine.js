import { calculateQuestionnaireBCS } from "../lib/bcsEngine.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { evaluateLifecycle } from "../lib/lifecycle.js";
import { calculateCalories } from "../lib/calories.js";
import { calculateMacros } from "../lib/macro.js";
import { allocateIngredients } from "../lib/allocation.js";
import { validateMinerals } from "../lib/mineral.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { breed, age_months, weight_kg, goal, activity_level } = req.body;

  if (!breed || !age_months || !weight_kg || !goal) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {

    // 1️⃣ Load JSON once
    const dataPath = path.join(__dirname, "../data/labrador_engine.json");
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const engineData = JSON.parse(rawData);
    const foodDB = engineData.Food_Composition_Database?.Ingredients;

    // 2️⃣ Lifecycle
    const lifecycleReport = evaluateLifecycle(
  age_months,
  weight_kg,
  req.body.gender || "Male",
  engineData
);

// 🔥 BCS Fusion Layer

const deviationBCS =
  lifecycleReport.deviation_bcs;

const questionnaireBCS =
  calculateQuestionnaireBCS(
    req.body.bcs_answers,
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

// 🔥 Map Final BCS → Category
{

let finalCategory = lifecycleReport.deviation_category;

if (finalBCS <= 3) finalCategory = "Underweight";
else if (finalBCS <= 5) finalCategory = "Ideal";
else if (finalBCS <= 7) finalCategory = "Overweight";
else finalCategory = "Obese";
  }

let finalCategory = null;

if (categoryMap) {
  for (const category in categoryMap) {

    const range = categoryMap[category];

    if (
      finalBCS >= range[0] &&
      finalBCS <= range[1]
    ) {
      finalCategory = category;
      break;
    }
  }
}

    // 3️⃣ Calories
    const calorieReport = calculateCalories(
  weight_kg,
  activity_level || "Moderate",
  goal,
  finalCategory,
  lifecycleReport.life_stage,
  age_months,
  engineData
);

    // 4️⃣ Macros
    const macroReport = calculateMacros(
  calorieReport.final_calories,
  lifecycleReport.life_stage,
  goal,
  engineData
);

    // 5️⃣ Allocation
    const allocationReport = allocateIngredients(
  macroReport,
  lifecycleReport.life_stage
);

    // 6️⃣ Minerals
    const mineralReport = validateMinerals(
      lifecycleReport.life_stage,
      calorieReport.final_calories,
      allocationReport,
      foodDB
    );

    console.log("AGE:", age_months);
console.log("IS SENIOR:", age_months >= 84);

    return res.status(200).json({
      input: req.body,
      lifecycle_report: lifecycleReport,
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