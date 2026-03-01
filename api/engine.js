export function allocateIngredients(
  macroReport,
  life_stage,
  finalCategory,
  engineData,
  foodDB
) {
  try {

    // 🔹 Basic Safety Guards
    if (!macroReport) {
      throw new Error("macroReport missing in allocation");
    }

    if (!engineData) {
      throw new Error("engineData missing in allocation");
    }

    if (!foodDB || Object.keys(foodDB).length === 0) {
      throw new Error("Food database not available");
    }

    // 🔹 Lifecycle Mapping (IMPORTANT)
    const lifecycleMap = {
      Prime_Adult: "Adult",
      Young_Adult_Early: "Adult",
      Juvenile_I: "Puppy",
      Juvenile_II: "Puppy",
      Senior: "Senior"
    };

    const poolKey = lifecycleMap[life_stage] || life_stage;

    const pool =
      engineData?.Rotational_Ingredient_Pools?.[poolKey];

    if (!pool) {
      throw new Error(`No rotation pool found for lifecycle: ${poolKey}`);
    }

    // 🔹 Extract Macro Targets (grams)
    const targetProtein = macroReport?.protein_g || 0;
    const targetFat = macroReport?.fat_g || 0;
    const targetCarbs = macroReport?.carb_g || 0;

    if (targetProtein <= 0) {
      throw new Error("Invalid protein target in macroReport");
    }

    // 🔹 Get Protein Sources
    const proteinSources = pool?.allowed_proteins || [];

    if (!proteinSources || proteinSources.length === 0) {
      throw new Error(`No protein sources defined for ${poolKey}`);
    }

    // 🔹 Select First Valid Protein (Simple deterministic rule)
    const selectedProteinName = proteinSources[0];

    const proteinData = foodDB?.[selectedProteinName];

    if (!proteinData) {
      throw new Error(`Protein not found in food DB: ${selectedProteinName}`);
    }

    const proteinPer100g = proteinData.protein_per_100g;

    if (!proteinPer100g || proteinPer100g <= 0) {
      throw new Error(`Invalid protein data for ${selectedProteinName}`);
    }

    // 🔹 Calculate Required Protein Grams of Ingredient
    const proteinIngredientGrams =
      (targetProtein / proteinPer100g) * 100;

    // 🔹 Simple Carb Allocation (Rice if available)
    let carbIngredientName = null;
    let carbIngredientGrams = 0;

    const carbSources = pool?.allowed_carbs || [];

    if (carbSources && carbSources.length > 0) {
      carbIngredientName = carbSources[0];

      const carbData = foodDB?.[carbIngredientName];

      if (carbData && carbData.carb_per_100g > 0) {
        carbIngredientGrams =
          (targetCarbs / carbData.carb_per_100g) * 100;
      }
    }

    // 🔹 Simple Fat Allocation (Oil if available)
    let fatIngredientName = null;
    let fatIngredientGrams = 0;

    const fatSources = pool?.allowed_fats || [];

    if (fatSources && fatSources.length > 0) {
      fatIngredientName = fatSources[0];

      const fatData = foodDB?.[fatIngredientName];

      if (fatData && fatData.fat_per_100g > 0) {
        fatIngredientGrams =
          (targetFat / fatData.fat_per_100g) * 100;
      }
    }

    // 🔹 Build Final Ingredient List
    const ingredients = [];

    ingredients.push({
      name: selectedProteinName,
      grams: Number(proteinIngredientGrams.toFixed(2))
    });

    if (carbIngredientName && carbIngredientGrams > 0) {
      ingredients.push({
        name: carbIngredientName,
        grams: Number(carbIngredientGrams.toFixed(2))
      });
    }

    if (fatIngredientName && fatIngredientGrams > 0) {
      ingredients.push({
        name: fatIngredientName,
        grams: Number(fatIngredientGrams.toFixed(2))
      });
    }

    return {
      lifecycle_used: poolKey,
      target_macros: {
        protein_g: targetProtein,
        fat_g: targetFat,
        carb_g: targetCarbs
      },
      ingredients
    };

  } catch (err) {
    return {
      error: "Allocation failed",
      details: err.message
    };
  }
}