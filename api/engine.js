import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { evaluateLifecycle } from "../lib/lifecycle.js";
import { computeBCS } from "../lib/bcs.js";
import { generateWeightPlan } from "../lib/weightPlanner.js";
import { calculateCalories } from "../lib/calories.js";
import { calculateMacros } from "../lib/macro.js";
import { allocateIngredients } from "../lib/allocation.js";
import { validateMinerals } from "../lib/mineral.js";
import { generateRotationalPlan } from "../lib/rotationalPlanner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 Load Engine JSON ONCE (cold start only)
const dataPath = path.join(__dirname, "../data/labrador_engine.json");
const rawData = fs.readFileSync(dataPath, "utf-8");
const engineData = JSON.parse(rawData);

// 🔹 Resolve food DB once
const foodDB =
  engineData?.Expanded_Food_Composition_Database_v2?.Ingredients ||
  engineData?.Food_Composition_Database?.Ingredients;

if (!foodDB) {
  throw new Error("Food database missing in JSON");
}

// 🔹 Safe wrapper helper
function safeExecute(label, fn) {
  try {
    return fn();
  } catch (err) {
    return {
      error: `${label} failed`,
      details: err.message
    };
  }
}

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

  // 🔹 Basic Input Validation
  if (!breed || !age_months || !weight_kg || !goal) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {

    // =============================
    // STAGE 1 — Lifecycle
    // =============================
    const lifecycleReport = safeExecute("Lifecycle", () =>
      evaluateLifecycle(
        age_months,
        weight_kg,
        gender || "Male",
        engineData
      )
    );

    if (lifecycleReport?.error) {
      return res.status(500).json(lifecycleReport);
    }

    // =============================
    // STAGE 2 — BCS
    // =============================
    const bcsReport = safeExecute("BCS", () =>
      computeBCS(
        lifecycleReport.deviation_bcs,
        lifecycleReport.deviation_category,
        bcs_answers,
        engineData
      )
    );

    if (bcsReport?.error) {
      return res.status(500).json(bcsReport);
    }

    const finalCategory = bcsReport.final_bcs_category;

    // =============================
    // STAGE 3 — Weight Plan
    // =============================
    const weightPlan = safeExecute("WeightPlan", () =>
      generateWeightPlan(
        weight_kg,
        lifecycleReport.ideal_weight,
        finalCategory
      )
    );

    // =============================
    // STAGE 4 — Calories
    // =============================
    const calorieReport = safeExecute("Calories", () =>
      calculateCalories(
        weight_kg,
        activity_level || "Moderate_Activity",
        goal,
        finalCategory,
        lifecycleReport.life_stage,
        age_months,
        engineData
      )
    );

    if (calorieReport?.error) {
      return res.status(500).json(calorieReport);
    }

    // =============================
    // STAGE 5 — Macros
    // =============================
    const macroReport = safeExecute("Macros", () =>
      calculateMacros(
        calorieReport.final_calories,
        lifecycleReport.life_stage,
        goal,
        engineData
      )
    );

    if (macroReport?.error) {
      return res.status(500).json(macroReport);
    }

    // =============================
    // STAGE 6 — Allocation
    // =============================
    const allocationReport = safeExecute("Allocation", () =>
      allocateIngredients(
        macroReport,
        lifecycleReport.life_stage,
        finalCategory,
        engineData,
        foodDB
      )
    );

    // =============================
    // STAGE 7 — Minerals
    // =============================
    const mineralReport = safeExecute("Minerals", () =>
      validateMinerals(
        lifecycleReport.life_stage,
        calorieReport.final_calories,
        allocationReport,
        foodDB
      )
    );

    // =============================
    // STAGE 8 — Rotation
    // =============================
    const rotationalPlan = safeExecute("Rotation", () =>
      generateRotationalPlan(
        lifecycleReport.life_stage,
        finalCategory,
        {
          ...macroReport,
          calories: calorieReport.final_calories
        },
        engineData,
        foodDB,
        validateMinerals
      )
    );

    // =============================
    // FINAL RESPONSE
    // =============================
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
