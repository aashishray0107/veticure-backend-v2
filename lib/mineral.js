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

    const chicken = foodDB["Chicken breast boiled"];
    const rice = foodDB["Rice cooked white"];

    let egg;
    if (life_stage === "Senior") {
      egg = foodDB["Egg white boiled"];
    } else {
      egg = foodDB["Egg whole boiled"];
    }

    const calciumSupplement =
      foodDB["Calcium carbonate powder"];

    if (!chicken || !rice || !egg || !calciumSupplement) {
      throw new Error("Required ingredients missing");
    }

    let chicken_g = allocation?.chicken_g || 0;
    let rice_g = allocation?.rice_g || 0;
    let egg_g = allocation?.egg_g || 0;
    let calcium_supplement_g = 0;

    let total_calcium =
      (chicken_g * chicken.calcium_g) / 100 +
      (rice_g * rice.calcium_g) / 100 +
      (egg_g * egg.calcium_g) / 100;

    let total_phosphorus =
      (chicken_g * chicken.phosphorus_g) / 100 +
      (rice_g * rice.phosphorus_g) / 100 +
      (egg_g * egg.phosphorus_g) / 100;

    if (total_phosphorus <= 0) total_phosphorus = 0.0001;

    let minCaPer1000 = life_stage === "Puppy" ? 3.0 : 1.25;
    let maxCaPer1000 = life_stage === "Puppy" ? 4.5 : 6.25;

    const required_calcium =
      (minCaPer1000 * final_calories) / 1000;

    if (total_calcium < required_calcium) {
      const deficit = required_calcium - total_calcium;
      const calciumPerGram =
        calciumSupplement.calcium_g / 100;

      calcium_supplement_g = deficit / calciumPerGram;

      total_calcium +=
        (calcium_supplement_g *
          calciumSupplement.calcium_g) / 100;
    }

    // === Ca:P RATIO CAP (max 2.0) ===

const maxCaPRatio = 2.0;

let currentRatio =
  total_calcium / total_phosphorus;

if (currentRatio > maxCaPRatio) {

  const allowedCalcium =
    total_phosphorus * maxCaPRatio;

  const excessCalcium =
    total_calcium - allowedCalcium;

  const calciumPerGram =
    calciumSupplement.calcium_g / 100;

  const reduceSupplement =
    excessCalcium / calciumPerGram;

  calcium_supplement_g -= reduceSupplement;

  if (calcium_supplement_g < 0)
    calcium_supplement_g = 0;

  total_calcium =
    allowedCalcium;
}

    const calcium_per_1000_kcal =
      (total_calcium * 1000) / final_calories;

    const phosphorus_per_1000_kcal =
      (total_phosphorus * 1000) / final_calories;

    const ca_p_ratio =
      total_calcium / total_phosphorus;

    let renal_compliant = true;
    let renal_warning = null;

    if (life_stage === "Senior") {
      if (phosphorus_per_1000_kcal > 0.9) {
        renal_compliant = false;
        renal_warning =
          "Phosphorus above senior safe threshold (0.5 g/1000 kcal)";
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
      renal_warning
    };

  } catch (err) {
    return {
      error: "Mineral computation failed",
      details: err.message
    };
  }
}