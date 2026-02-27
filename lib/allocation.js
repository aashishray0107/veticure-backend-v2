import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function allocateIngredients(macroReport) {
  try {
    const dataPath = path.join(__dirname, "../data/labrador_engine.json");
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const engineData = JSON.parse(rawData);

    const foodDB = engineData.Food_Composition_Database?.Ingredients;

    if (!foodDB) {
      return { error: "Food database missing or malformed" };
    }

    const chicken = foodDB["Chicken breast boiled"];
    const rice = foodDB["Rice cooked white"];
    const egg = foodDB["Egg whole boiled"];

    if (!chicken || !rice || !egg) {
      return { error: "Required ingredients missing" };
    }

    // === STEP 1: Base Allocation ===
    const proteinPerGramChicken = chicken.protein_g / 100;
    const carbPerGramRice = rice.carbs_g / 100;

    let chicken_g = macroReport.protein_g / proteinPerGramChicken;
    let rice_g = macroReport.carbs_g / carbPerGramRice;

    // === STEP 2: Calculate Base Fat ===
    const fatFromChicken = (chicken_g * chicken.fat_g) / 100;
    const fatFromRice = (rice_g * rice.fat_g) / 100;

    let totalFat = fatFromChicken + fatFromRice;
    let egg_g = 0;

    // === STEP 3: Fat Correction Using Egg ===
    if (totalFat < macroReport.fat_g) {
      const fatDeficit = macroReport.fat_g - totalFat;

      const fatPerGramEgg = egg.fat_g / 100;
      egg_g = fatDeficit / fatPerGramEgg;

      // Egg adds protein too
      const proteinAddedFromEgg = (egg_g * egg.protein_g) / 100;

      // Reduce chicken to compensate protein increase
      chicken_g -= proteinAddedFromEgg / proteinPerGramChicken;

      // Recalculate fat after adjustment
      const updatedFatFromChicken = (chicken_g * chicken.fat_g) / 100;
      const updatedFatFromEgg = (egg_g * egg.fat_g) / 100;

      totalFat = updatedFatFromChicken + fatFromRice + updatedFatFromEgg;
    }

    // === STEP 4: Final Macro Validation ===
    const finalProtein =
      (chicken_g * chicken.protein_g) / 100 +
      (egg_g * egg.protein_g) / 100;

    const finalCarbs = (rice_g * rice.carbs_g) / 100;

    const finalFat =
      (chicken_g * chicken.fat_g) / 100 +
      (rice_g * rice.fat_g) / 100 +
      (egg_g * egg.fat_g) / 100;

    return {
      chicken_g: Math.round(chicken_g),
      rice_g: Math.round(rice_g),
      egg_g: Math.round(egg_g),

      final_macros: {
        protein_g: Math.round(finalProtein),
        fat_g: Math.round(finalFat),
        carbs_g: Math.round(finalCarbs)
      }
    };

  } catch (err) {
    return {
      error: "Allocation engine failed",
      details: err.message
    };
  }
}
