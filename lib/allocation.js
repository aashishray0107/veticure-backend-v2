import engineData from "../data/labrador_engine.json" assert { type: "json" };

export function allocateIngredients(macroReport) {

  const foodDB = engineData.Food_Nutrition_Database;

  const chicken = foodDB.Boiled_Chicken_Breast_Skinless;
  const rice = foodDB.Boiled_White_Rice;

  // Protein allocation (from chicken)
  const chicken_grams = macroReport.protein_g / (chicken.protein_g_per_100g / 100);

  // Carbs allocation (from rice)
  const rice_grams = macroReport.carbs_g / (rice.carbs_g_per_100g / 100);

  return {
    chicken_g: Math.round(chicken_grams),
    rice_g: Math.round(rice_grams)
  };
}