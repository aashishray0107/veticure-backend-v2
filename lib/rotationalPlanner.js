export function generateRotationalPlan(
  life_stage,
  final_bcs_category,
  macroReport,
  engineData,
  foodDB,
  validateMinerals
) {

  const pool =
  engineData?.Rotational_Ingredient_Pools?.[lifecycle];

if (!pool) {
  throw new Error(`No rotation pool for lifecycle: ${lifecycle}`);
}

  const totalCalories =
    macroReport?.calories || null;

  if (!macroReport?.protein_g) {
    throw new Error("Macro report invalid");
  }

  const days = [];

  const proteinTarget = macroReport.protein_g;
  const carbTarget = macroReport.carbs_g;
  const fatTarget = macroReport.fat_g;

  // 🔥 Category Logic

  let proteinGroup = "Lean";
  let allowFat = true;
  let includeOrgan = false;

  if (final_bcs_category === "Underweight") {
    proteinGroup = "Moderate_Fat";
    allowFat = true;
    includeOrgan = true;
  }

  if (final_bcs_category === "Overweight") {
    proteinGroup = "Lean";
    allowFat = false;
  }

  if (final_bcs_category === "Obese") {
    proteinGroup = "Lean";
    allowFat = false;
  }

  // 🔥 3-Day Rotation

  for (let i = 0; i < 3; i++) {

    const proteinList =
      pools.Protein[proteinGroup];

    const carbList =
      i === 1
        ? pools.Carbohydrate.Low_GI_Alternative
        : pools.Carbohydrate.Primary;

    const vegFiber =
      pools.Vegetables.Low_Calorie_Fiber;

    const vegMicro =
      pools.Vegetables.Micronutrient_Dense;

    const selectedProtein =
      proteinList[i % proteinList.length];

    const selectedCarb =
      carbList[i % carbList.length];

    const selectedVeg1 =
      vegFiber[i % vegFiber.length];

    const selectedVeg2 =
      vegMicro[i % vegMicro.length];

    const selectedFat =
      allowFat
        ? pools.Fats.Essential_Omega3[0]
        : null;

    // 🔥 Rough Allocation Logic (macro-based)

    const proteinFood =
      foodDB[selectedProtein];

    const carbFood =
      foodDB[selectedCarb];

    const vegFood1 =
      foodDB[selectedVeg1];

    const vegFood2 =
      foodDB[selectedVeg2];

    if (!proteinFood) {
  continue;
}

if (!carbFood) {
  continue;
}

    const proteinPer100 =
      proteinFood.protein_g || 1;

    const carbPer100 =
      carbFood.carbs_g || 1;

    const proteinGrams =
      (proteinTarget / proteinPer100) * 100;

    const carbGrams =
      (carbTarget / carbPer100) * 100;

    const vegGrams = 80; // fixed veg inclusion baseline

    let fatGrams = 0;

    if (selectedFat && foodDB[selectedFat]) {
      fatGrams = 5;
    }

    const ingredients = [
      { name: selectedProtein, grams: Math.round(proteinGrams) },
      { name: selectedCarb, grams: Math.round(carbGrams) },
      { name: selectedVeg1, grams: vegGrams },
      { name: selectedVeg2, grams: vegGrams },
    ];

    if (selectedFat) {
      ingredients.push({
        name: selectedFat,
        grams: fatGrams
      });
    }

    // 🔥 Mineral Check Per Day

    const mineralReport =
      validateMinerals(
        life_stage,
        macroReport.calories,
        { ingredients },
        foodDB
      );

    days.push({
      day: i + 1,
      ingredients,
      mineral_report: mineralReport
    });
  }

  return { days };
}