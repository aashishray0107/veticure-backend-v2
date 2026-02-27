export function validateMinerals(life_stage, final_calories) {

  // NRC safe calcium per 1000 kcal for large breed growth
  const calcium_per_1000kcal_min = 3.0;
  const calcium_per_1000kcal_max = 4.5;

  let calcium_range;

  if (life_stage === "Puppy") {
    calcium_range = {
      min: calcium_per_1000kcal_min,
      max: calcium_per_1000kcal_max
    };
  } else {
    // Adults have wider tolerance
    calcium_range = {
      min: 1.0,
      max: 6.0
    };
  }

  return {
    calcium_safe_range_per_1000kcal: calcium_range,
    note: "Mineral validation placeholder — ingredient integration pending"
  };
}