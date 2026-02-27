import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, "../data/labrador_engine.json");
const rawData = fs.readFileSync(dataPath, "utf-8");
const engineData = JSON.parse(rawData);

const foodDB = engineData.Food_Composition_Database?.Ingredients;

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { breed, age_months, weight_kg, goal, activity_level } = req.body;

  if (!breed || !age_months || !weight_kg || !goal) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // 1️⃣ Lifecycle
  const lifecycleReport = evaluateLifecycle(age_months, weight_kg);

  // 2️⃣ Calories
  const calorieReport = calculateCalories(
    weight_kg,
    activity_level || "Moderate",
    goal,
    lifecycleReport.bcs_category
  );

  // 3️⃣ Macros
  const macroReport = calculateMacros(
    calorieReport.final_calories,
    lifecycleReport.life_stage,
    goal
  );

  // 4️⃣ Allocation
  const allocationReport = allocateIngredients(macroReport);

  // 🔥 Load food database for mineral computation
  const dataPath = path.join(process.cwd(), "data", "labrador_engine.json");
  const engineData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const foodDB = engineData.Food_Composition_Database?.Ingredients;

  // 5️⃣ Mineral Validation from REAL ingredient grams
 const mineralReport = validateMinerals(
  lifecycleReport.life_stage,
  calorieReport.final_calories,
  allocationReport,
  foodDB
);

  return res.status(200).json({
    input: req.body,
    lifecycle_report: lifecycleReport,
    calorie_report: calorieReport,
    macro_report: macroReport,
    allocation_report: allocationReport,
    mineral_report: mineralReport
  });
}