export function validateMinerals(
  life_stage,
  final_calories,
  allocation,
  foodDB
) {
  try {

    if (!foodDB) {
      throw new Error("Food database missing");
    }

    if (!allocation?.ingredients?.length) {
      throw new Error("No ingredients provided");
    }

    let total_calcium = 0;
    let total_phosphorus = 0;
    let mineral_adjustment = false;

    // 🔥 Dynamic mineral accumulation
    for (const item of allocation.ingredients) {

      const nutrient = foodDB[item.name];

      if (!nutrient) {
        throw new Error(`Ingredient not found in DB: ${item.name}`);
      }

      const grams = item.grams || 0;

      total_calcium +=
        (grams * (nutrient.calcium_g || 0)) / 100;

      total_phosphorus +=
        (grams * (nutrient.phosphorus_g || 0)) / 100;
    }

    if (total_phosphorus <= 0) {
      total_phosphorus = 0.0001;
    }

    // 🔥 Requirement from calories
    const minCaPer1000 =
      life_stage === "Puppy" ? 3.0 : 1.25;

    const required_calcium =
      (minCaPer1000 * final_calories) / 1000;

      if (!calciumSupplement) {
  console.warn("Calcium supplement not found in DB");
}

    const calciumSupplement =
  foodDB["Calcium carbonate powder"] || null;

    if (!calciumSupplement) {
      throw new Error("Calcium supplement missing in DB");
    }

    let calcium_supplement_g = 0;

    if (total_calcium < required_calcium) {

      const deficit =
        required_calcium - total_calcium;

      const calciumPerGram =
        calciumSupplement.calcium_g / 100;

      calcium_supplement_g =
        deficit / calciumPerGram;

      total_calcium +=
        (calcium_supplement_g *
         calciumSupplement.calcium_g) / 100;

      mineral_adjustment = true;
    }

    // 🔥 Ca:P ratio cap
    const maxCaPRatio = 1.4;

    let currentRatio =
      total_calcium / total_phosphorus;

    if (currentRatio > maxCaPRatio) {

      mineral_adjustment = true;

      const allowedCalcium =
        total_phosphorus * maxCaPRatio;

      const excess =
        total_calcium - allowedCalcium;

      const calciumPerGram =
        calciumSupplement.calcium_g / 100;

      const reduce =
        excess / calciumPerGram;

      calcium_supplement_g -= reduce;

      if (calcium_supplement_g < 0)
        calcium_supplement_g = 0;

      total_calcium = allowedCalcium;
    }

    const calcium_per_1000_kcal =
      (total_calcium * 1000) / final_calories;

    const phosphorus_per_1000_kcal =
      (total_phosphorus * 1000) / final_calories;

    const ca_p_ratio =
      total_calcium / total_phosphorus;

    // 🔥 Renal check
    let renal_compliant = true;
    let renal_warning = null;

    if (life_stage === "Senior") {
      if (phosphorus_per_1000_kcal > 0.9) {
        renal_compliant = false;
        renal_warning =
          "Phosphorus above senior safe threshold";
      }
    }

    return {
      total_calcium_g: Number(total_calcium.toFixed(3)),
      total_phosphorus_g: Number(total_phosphorus.toFixed(3)),
      ca_p_ratio: Number(ca_p_ratio.toFixed(3)),
      calcium_per_1000_kcal: Number(calcium_per_1000_kcal.toFixed(3)),
      phosphorus_per_1000_kcal: Number(phosphorus_per_1000_kcal.toFixed(3)),
      calcium_supplement_g: Number(calcium_supplement_g.toFixed(2)),
      renal_compliant,
      renal_warning,
      mineral_adjustment
    };

  } catch (err) {
    return {
      error: "Mineral computation failed",
      details: err.message
    };
  }
}