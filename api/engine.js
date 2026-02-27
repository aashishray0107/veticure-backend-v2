import { evaluateLifecycle } from "../lib/lifecycle.js";
import { calculateCalories } from "../lib/calories.js";
import { calculateMacros } from "../lib/macro.js";
import { allocateIngredients } from "../lib/allocation.js";
import { validateMinerals } from "../lib/mineral.js";


export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { breed, age_months, weight_kg, goal, activity_level } = req.body;

  if (!breed || !age_months || !weight_kg || !goal) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const lifecycleReport = evaluateLifecycle(age_months, weight_kg);

  const calorieReport = calculateCalories(
    weight_kg,
    activity_level || "Moderate",
    goal,
    lifecycleReport.bcs_category
  );

  const macroReport = calculateMacros(
    calorieReport.final_calories,
    lifecycleReport.life_stage,
    goal
  );

  const allocationReport = allocateIngredients(macroReport);

  const mineralReport = validateMinerals(
  lifecycleReport.life_stage,
  calorieReport.final_calories
);



    return res.status(200).json({
    input: req.body,
    lifecycle_report: lifecycleReport,
    calorie_report: calorieReport,
    macro_report: macroReport,
    mineral_report: mineralReport,
    allocation_report: allocationReport
  });
}
