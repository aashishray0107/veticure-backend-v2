export function evaluateLifecycle(age_months) {
  let life_stage;

  if (age_months < 12) {
    life_stage = "Puppy";
  } else if (age_months < 84) {
    life_stage = "Adult";
  } else {
    life_stage = "Senior";
  }

  return { life_stage };
}