import { evaluateLifecycle } from "../lib/lifecycle.js";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { breed, age_months, weight_kg, goal } = req.body;

  if (!breed || !age_months || !weight_kg || !goal) {
    return res.status(400).json({
      error: "Missing required fields"
    });
  }

  const lifecycleReport = evaluateLifecycle(age_months, weight_kg);

  return res.status(200).json({
    input: req.body,
    lifecycle_report: lifecycleReport
  });

}
