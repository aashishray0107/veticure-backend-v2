export function validateMinerals(
  life_stage,
  final_calories,
  allocation,
  foodDB
) {
  try {
    if (!foodDB) {
      throw new Error("Food database not provided");
    }

    const chicken = foodDB["Chicken breast boiled"];
    const rice = foodDB["Rice cooked white"];
    const egg = foodDB["Egg whole boiled"];
    const calciumSupplement =
      foodDB["Calcium carbonate powder"];

    if (!chicken || !rice || !egg || !calciumSupplement) {
      throw new Error("Required ingredients missing in database");
    }

    const chicken_g = allocation?.chicken_g || 0;
    const rice_g = allocation?.rice_g || 0;
    const egg_g = allocation?.egg_g || 0;

    // =============================
    // BASE MINERAL CALCULATION
    // =============================

    let total_calcium =
      (chicken_g * chicken.calcium_g) / 100 +
      (rice_g * rice.calcium_g) / 100 +
      (egg_g * egg.calcium_g) / 100;

    let total_phosphorus =
      (chicken_g * chicken.phosphorus_g) / 100 +
      (rice_g * rice.phosphorus_g) / 100 +
      (egg_g * egg.phosphorus_g) / 100;

    if (total_phosphorus <= 0) {
      total_phosphorus = 0.0001;
    }

    // =============================
    // LIFECYCLE MINERAL STANDARDS
    // =============================

    let minCalciumPer1000;
    let maxCalciumPer1000;
    let minCaPRatio;
    let maxCaPRatio;

    if (life_stage === "Puppy") {
      // NRC Large Breed Growth
      minCalciumPer1000 = 3.0;
      maxCalciumPer1000 = 4.5;
      minCaPRatio = 1.1;
      maxCaPRatio = 1.4;
    } else {
      // AAFCO Adult Maintenance
      minCalciumPer1000 = 1.25;
      maxCalciumPer1000 = 6.25;
      minCaPRatio = 1.0;
      maxCaPRatio = 2.0;
    }

    const required_calcium =
      (minCalciumPer1000 * final_calories) / 1000;

    let calcium_supplement_g = 0;

    // =============================
    // CALCIUM AUTO-CORRECTION
    // =============================

    if (total_calcium < required_calcium) {
      const deficit = required_calcium - total_calcium;
      const calciumPerGram =
        calciumSupplement.calcium_g / 100;

      calcium_supplement_g = deficit / calciumPerGram;

      if (calcium_supplement_g > 15) {
        calcium_supplement_g = 15;
      }

      total_calcium +=
        (calcium_supplement_g *
          calciumSupplement.calcium_g) / 100;
    }

    const calcium_per_1000_kcal = Number(
      ((total_calcium * 1000) / final_calories).toFixed(3)
    );

    const ca_p_ratio = Number(
      (total_calcium / total_phosphorus).toFixed(3)
    );

    const lifecycle_compliant =
      calcium_per_1000_kcal >= minCalciumPer1000 &&
      calcium_per_1000_kcal <= maxCalciumPer1000 &&
      ca_p_ratio >= minCaPRatio &&
      ca_p_ratio <= maxCaPRatio;

    // =============================
    // SENIOR PHOSPHORUS CONTROL
    // =============================

    const phosphorus_per_1000_kcal = Number(
      ((total_phosphorus * 1000) / final_calories).toFixed(3)
    );

    let renal_compliant = true;
    let renal_warning = null;

    if (life_stage === "Senior") {
      if (phosphorus_per_1000_kcal > 0.5) {
        renal_compliant = false;
        renal_warning =
          "Phosphorus exceeds senior renal-safe threshold (0.5 g/1000 kcal). Reduce high-phosphorus proteins.";
      }
    }

    // =============================
    // DRY MATTER PROTEIN VALIDATION
    // =============================

    const total_moisture =
      (chicken_g * chicken.moisture_g) / 100 +
      (rice_g * rice.moisture_g) / 100 +
      (egg_g * egg.moisture_g) / 100;

    const total_weight =
      chicken_g +
      rice_g +
      egg_g +
      calcium_supplement_g;

    const total_dry_matter =
      total_weight - total_moisture;

    if (total_dry_matter <= 0) {
      throw new Error("Invalid dry matter calculation");
    }

    const total_protein =
      (chicken_g * chicken.protein_g) / 100 +
      (rice_g * rice.protein_g) / 100 +
      (egg_g * egg.protein_g) / 100;

    const protein_pct_dm = Number(
      ((total_protein / total_dry_matter) * 100).toFixed(2)
    );

    const minProteinDM =
      life_stage === "Puppy" ? 22.5 : 18;

    const protein_compliant =
      protein_pct_dm >= minProteinDM;

    // =============================
    // FINAL OVERALL COMPLIANCE
    // =============================

    const overall_compliant =
      lifecycle_compliant &&
      protein_compliant &&
      renal_compliant;

    // =============================
    // RETURN STRUCTURE
    // =============================

    return {
      total_calcium_g: Number(total_calcium.toFixed(3)),
      total_phosphorus_g: Number(total_phosphorus.toFixed(3)),
      ca_p_ratio,
      calcium_per_1000_kcal,
      phosphorus_per_1000_kcal,
      calcium_supplement_g:
        Number(calcium_supplement_g.toFixed(2)),
      lifecycle_compliant,
      renal_compliant,
      renal_warning,
      protein_pct_dm,
      protein_compliant,
      overall_compliant,
      regulatory_reference:
        life_stage === "Puppy"
          ? "NRC 2006 Large Breed Growth + AAFCO Protein DM"
          : "AAFCO 2023 Adult Maintenance Profile"
    };

  } catch (err) {
    return {
      error: "Mineral computation failed",
      details: err.message
    };
  }
}