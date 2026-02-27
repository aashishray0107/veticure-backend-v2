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

    const chicken_g = allocation.chicken_g || 0;
    const rice_g = allocation.rice_g || 0;
    const egg_g = allocation.egg_g || 0;

    const calcium =
      (chicken_g * chicken.calcium_g) / 100 +
      (rice_g * rice.calcium_g) / 100 +
      (egg_g * egg.calcium_g) / 100;

    const phosphorus =
      (chicken_g * chicken.phosphorus_g) / 100 +
      (rice_g * rice.phosphorus_g) / 100 +
      (egg_g * egg.phosphorus_g) / 100;

    const ca_p_ratio = calcium / phosphorus;

    const calcium_per_1000_kcal =
      (calcium * 1000) / final_calories;

    let lifecycle_validation;

    if (life_stage === "Puppy") {
      lifecycle_validation =
        calcium_per_1000_kcal >= 3.0 &&
        calcium_per_1000_kcal <= 4.5 &&
        ca_p_ratio >= 1.1 &&
        ca_p_ratio <= 1.4;
    } else {
      lifecycle_validation =
        calcium_per_1000_kcal >= 1.0 &&
        calcium_per_1000_kcal <= 6.0;
    }

    return {
      total_calcium_g: Number(calcium.toFixed(3)),
      total_phosphorus_g: Number(phosphorus.toFixed(3)),
      ca_p_ratio: Number(ca_p_ratio.toFixed(2)),
      calcium_per_1000_kcal: Number(calcium_per_1000_kcal.toFixed(2)),
      lifecycle_compliant: lifecycle_validation
    };

  } catch (err) {
    return {
      error: "Mineral computation failed",
      details: err.message
    };
  }
}