import { evaluateLifecycle } from "../lib/lifecycle.js";
import { calculateCalories } from "../lib/calories.js";
import { calculateMacros } from "../lib/macro.js";
import { allocateIngredients } from "../lib/allocation.js";

export default async function handler(req, res) {
  try {
    return res.status(200).json({
      lifecycle_type: typeof evaluateLifecycle,
      calories_type: typeof calculateCalories,
      macro_type: typeof calculateMacros,
      allocation_type: typeof allocateIngredients
    });
  } catch (err) {
    return res.status(500).json({
      error: "Import failed",
      details: err.message
    });
  }
}