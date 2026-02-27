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

    return {
      debug_chicken_object: chicken,
      debug_rice_object: rice
    };

  } catch (err) {
    return {
      error: "Allocation engine failed",
      details: err.message
    };
  }
}