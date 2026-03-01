import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function allocateIngredients(
  macroReport,
  life_stage,
  final_bcs_category
) {

  const dataPath = path.join(
    __dirname,
    "../data/labrador_engine.json"
  );

  const rawData = fs.readFileSync(dataPath, "utf-8");
  const engineData = JSON.parse(rawData);

  const foodDB =
    engineData?.Food_Composition_Database?.Ingredients;

  if (!foodDB) {
    throw new Error("Food database missing");
  }

  // 🔥 Dynamic Pools

  const proteinPool = [];
  const carbPool = [];
  const fatPool = [];
  const fiberPool = [];

  for (const name in foodDB) {

    const item = foodDB[name];

    const protein = item.protein_g || 0;
    const carbs = item.carbs_g || 0;
    const fat = item.fat_g || 0;
    const fiber = item.fiber_g || 0;

    if (protein > 18) proteinPool.push({ name, ...item });
    if (carbs > 20) carbPool.push({ name, ...item });
    if (fat > 15) fatPool.push({ name, ...item });
    if (fiber > 5) fiberPool.push({ name, ...item });
  }

  if (!proteinPool.length || !carbPool.length) {
    throw new Error("Ingredient pools insufficient");
  }

  // 🔥 Select Based on BCS

  let selectedProtein;
  let selectedCarb;
  let selectedFat;

  if (final_bcs_category === "Overweight" ||
      final_bcs_category === "Obese") {

    // Leanest protein
    selectedProtein = proteinPool.sort(
      (a, b) => a.fat_g - b.fat_g
    )[0];

    selectedCarb = carbPool[0];

  } else if (
    final_bcs_category === "Underweight" ||
    final_bcs_category === "Severe_Underweight"
  ) {

    // Higher fat protein
    selectedProtein = proteinPool.sort(
      (a, b) => b.fat_g - a.fat_g
    )[0];

    selectedCarb = carbPool[0];

    selectedFat = fatPool[0];

  } else {

    selectedProtein = proteinPool[0];
    selectedCarb = carbPool[0];
  }

  // 🔥 Macro Allocation

  const proteinPerGram =
    selectedProtein.protein_g / 100;

  const carbPerGram =
    selectedCarb.carbs_g / 100;

  const proteinGrams =
  macroReport.protein_g / proteinPerGram;

const carbGrams =
  macroReport.carbs_g / carbPerGram;

let fatGrams = 0;

if (selectedFat) {
  const fatPerGram =
    selectedFat.fat_g / 100;

  fatGrams =
    macroReport.fat_g / fatPerGram;
}

  let fat_g = 0;

  if (selectedFat) {
    const fatPerGram =
      selectedFat.fat_g / 100;

    fat_g =
      macroReport.fat_g / fatPerGram;
  }

  return {
  ingredients: [
    {
      name: selectedProtein.name,
      grams: Math.round(proteinGrams)
    },
    {
      name: selectedCarb.name,
      grams: Math.round(carbGrams)
    },
    ...(selectedFat
      ? [{
          name: selectedFat.name,
          grams: Math.round(fatGrams)
        }]
      : [])
  ],
  final_macros: macroReport
};
}