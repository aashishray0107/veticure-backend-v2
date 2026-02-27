import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function allocateIngredients(macroReport, life_stage) {
  try {
    const dataPath = path.join(__dirname, "../data/labrador_engine.json");
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const engineData = JSON.parse(rawData);

    const foodDB =
      engineData.Food_Composition_Database?.Ingredients;

    if (!foodDB) {
      return { error: "Food database missing or malformed" };
    }

    const chicken = foodDB["Chicken breast boiled"];
    const rice = foodDB["Rice cooked white"];

    let egg;
    if (life_stage === "Senior") {
      egg = foodDB["Egg white boiled"];
    } else {
      egg = foodDB["Egg whole boiled"];
    }

    if (!chicken || !rice || !egg) {
      return { error: "Required ingredients missing" };
    }

    // =============================
    // STEP 1: Base Allocation
    // =============================

    const proteinPerGramChicken =
      chicken.protein_g / 100;

    const carbPerGramRice =
      rice.carbs_g / 100;

    let chicken_g =
      macroReport.protein_g / proteinPerGramChicken;

    let rice_g =
      macroReport.carbs_g / carbPerGramRice;

    // =============================
    // STEP 2: Fat From Base Sources
    // =============================

    const fatFromChicken =
      (chicken_g * chicken.fat_g) / 100;

    const fatFromRice =
      (rice_g * rice.fat_g) / 100;

    let totalFat = fatFromChicken + fatFromRice;

    let egg_g = 0;

    // =============================
    // STEP 3: Fat Correction (SAFE)
    // =============================

    if (totalFat < macroReport.fat_g) {

      const fatDeficit =
        macroReport.fat_g - totalFat;

      const fatPerGramEgg =
        egg.fat_g / 100;

      // 🔥 SAFE CHECK (egg white has zero fat)
      if (fatPerGramEgg > 0) {

        egg_g =
          fatDeficit / fatPerGramEgg;

        const proteinAddedFromEgg =
          (egg_g * egg.protein_g) / 100;

        // Reduce chicken to balance protein
        chicken_g -=
          proteinAddedFromEgg / proteinPerGramChicken;

      } else {
        // Senior egg white case → no fat contribution
        egg_g = 0;
      }
    }

    // =============================
    // STEP 4: Final Macro Calculation
    // =============================

    const finalProtein =
      (chicken_g * chicken.protein_g) / 100 +
      (egg_g * egg.protein_g) / 100;

    const finalCarbs =
      (rice_g * rice.carbs_g) / 100;

    const finalFat =
      (chicken_g * chicken.fat_g) / 100 +
      (rice_g * rice.fat_g) / 100 +
      (egg_g * egg.fat_g) / 100;

    // =============================
    // RETURN
    // =============================

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