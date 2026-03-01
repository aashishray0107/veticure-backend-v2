import { generateWeightPlan } from "../lib/weightPlanner.js";
import { computeBCS } from "../lib/bcs.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { evaluateLifecycle } from "../lib/lifecycle.js";
import { calculateCalories } from "../lib/calories.js";
import { calculateMacros } from "../lib/macro.js";
import { allocateIngredients } from "../lib/allocation.js";
import { generateRotationalPlan } from "../lib/rotationalPlanner.js";
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

    // 🔹 Load Engine JSON
    const dataPath = path.join(__dirname, "../data/labrador_engine.json");
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const engineData = JSON.parse(rawData);

    // 🔥 Support both DB structures (old + expanded)
    const foodDB =
      engineData?.Expanded_Food_Composition_Database_v2?.Ingredients ||
      engineData?.Food_Composition_Database?.Ingredients;

    if (!foodDB) {
      throw new Error("Food database missing in JSON");
    }

    // 🔹 Lifecycle
    const lifecycleReport = evaluateLifecycle(
      age_months,
      weight_kg,
      gender || "Male",
      engineData
    );

    // 🔹 BCS Fusion
    const bcsReport = computeBCS(
      lifecycleReport.deviation_bcs,
      lifecycleReport.deviation_category,
      bcs_answers,
      engineData
    );

    const finalCategory = bcsReport.final_bcs_category;

    // 🔹 Weight Plan
    const weightPlan = generateWeightPlan(
      weight_kg,
      lifecycleReport.ideal_weight,
      finalCategory
    );

    // 🔹 Calories
    const calorieReport = calculateCalories(
      weight_kg,
      activity_level || "Moderate_Activity",
      goal,
      finalCategory,
      lifecycleReport.life_stage,
      age_months,
      engineData
    );

    // 🔹 Macros
    const macroReport = calculateMacros(
      calorieReport.final_calories,
      lifecycleReport.life_stage,
      goal,
      engineData
    );

    // 🔹 Ingredient Allocation
    const allocationReport = allocateIngredients(
      macroReport,
      lifecycleReport.life_stage,
      finalCategory
    );

    // 🔹 Mineral Validation
    const mineralReport = validateMinerals(
      lifecycleReport.life_stage,
      calorieReport.final_calories,
      allocationReport,
      foodDB
    );

    // 🔹 Rotational Planner (safe mode)
    let rotationalPlan = null;

    try {
      rotationalPlan = generateRotationalPlan(
        lifecycleReport.life_stage,
        finalCategory,
        {
          ...macroReport,
          calories: calorieReport.final_calories
        },
        engineData,
        foodDB,
        validateMinerals
      );
    } catch (rotationError) {
      rotationalPlan = {
        error: "Rotational plan failed",
        details: rotationError.message
      };
    }

    // 🔹 Final Response
    return res.status(200).json({
      input: req.body,
      lifecycle_report: lifecycleReport,
      weight_plan: weightPlan,
      bcs_report: bcsReport,
      calorie_report: calorieReport,
      macro_report: macroReport,
      allocation_report: allocationReport,
      mineral_report: mineralReport,
      rotational_plan: rotationalPlan
    });

  } catch (err) {

    return res.status(500).json({
      error: "Engine crashed",
      details: err.message
    });
  }
}