export function validateMinerals(
  life_stage,
  final_calories,
  allocation,
  foodDB
) {
  try {
    const chicken = foodDB["Chicken breast boiled"];
    const rice = foodDB["Rice cooked white"];
    const egg = foodDB["Egg whole boiled"];
    const calciumSupplement = foodDB["Calcium carbonate powder"];

    const chicken_g = allocation.chicken_g || 0;
    const rice_g = allocation.rice_g || 0;
    const egg_g = allocation.egg_g || 0;

    // Base minerals
    let total_calcium =
      (chicken_g * chicken.calcium_g) / 100 +
      (rice_g * rice.calcium_g) / 100 +
      (egg_g * egg.calcium_g) / 100;

    let total_phosphorus =
      (chicken_g * chicken.phosphorus_g) / 100 +
      (rice_g * rice.phosphorus_g) / 100 +
      (egg_g * egg.phosphorus_g) / 100;

    // === Official Reference Thresholds ===
    const minCalciumPer1000 =
      life_stage === "Puppy" ? 3.0 : 1.25;

    const maxCalciumPer1000 =
      life_stage === "Puppy" ? 4.5 : 6.25;

    const required_calcium =
      (minCalciumPer1000 * final_calories) / 1000;

    let calcium_supplement_g = 0;

    // === Calcium Correction ===
    if (total_calcium < required_calcium) {
      const deficit = required_calcium - total_calcium;
      const calciumPerGramSupplement =
        calciumSupplement.calcium_g / 100;

      calcium_supplement_g =
        deficit / calciumPerGramSupplement;

      total_calcium +=
        (calcium_supplement_g *
          calciumSupplement.calcium_g) /
        100;
    }

    const ca_p_ratio =
      total_calcium / total_phosphorus;

    const calcium_per_1000_kcal =
      (total_calcium * 1000) /
      final_calories;

    // === Compliance Check ===
    let lifecycle_compliant;

    if (life_stage === "Puppy") {
      lifecycle_compliant =
        calcium_per_1000_kcal >= 3.0 &&
        calcium_per_1000_kcal <= 4.5 &&
        ca_p_ratio >= 1.1 &&
        ca_p_ratio <= 1.4;
    } else {
      lifecycle_compliant =
        calcium_per_1000_kcal >= 1.25 &&
        calcium_per_1000_kcal <= 6.25 &&
        ca_p_ratio >= 1.0 &&
        ca_p_ratio <= 2.0;
    }

    return {
      total_calcium_g:
        Number(total_calcium.toFixed(3)),
      total_phosphorus_g:
        Number(total_phosphorus.toFixed(3)),
      ca_p_ratio:
        Number(ca_p_ratio.toFixed(2)),
      calcium_per_1000_kcal:
        Number(calcium_per_1000_kcal.toFixed(2)),
      calcium_supplement_g:
        Number(calcium_supplement_g.toFixed(2)),
      lifecycle_compliant,
      reference: "AAFCO Adult Maintenance & NRC Growth Standards"
    };

  } catch (err) {
    return {
      error: "Mineral computation failed",
      details: err.message
    };
  }
}