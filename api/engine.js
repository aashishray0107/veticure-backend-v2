import { evaluateLifecycle } from "../lib/lifecycle.js";

export default async function handler(req, res) {
  try {
    return res.status(200).json({
      lifecycle_type: typeof evaluateLifecycle
    });
  } catch (err) {
    return res.status(500).json({
      error: "Import failed",
      details: err.message
    });
  }
}