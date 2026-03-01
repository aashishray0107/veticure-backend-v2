import { generateWeightPlan } from "../lib/weightPlanner.js";
import { computeBCS } from "../lib/bcs.js";
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

    // 🔥 Full BCS Fusion (Single Authority)
const bcsReport = computeBCS(
  lifecycleReport.deviation_bcs,
  lifecycleReport.deviation_category,
  bcs_answers,
  engineData
);

const finalCategory = bcsReport.final_bcs_category;

const weightPlan = generateWeightPlan(
  weight_kg,
  lifecycleReport.ideal_weight,
  finalCategory
);

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

      weight_plan: weightPlan,

      bcs_report: bcsReport,

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