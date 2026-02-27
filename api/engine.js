export default async function handler(req, res) {

  // 1️⃣ Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST method allowed"
    });
  }

  // 2️⃣ Read input body
  const { breed, age_months, weight_kg, goal } = req.body;

  // 3️⃣ Basic validation
  if (!breed || !age_months || !weight_kg || !goal) {
    return res.status(400).json({
      error: "Missing required fields: breed, age_months, weight_kg, goal"
    });
  }

  // 4️⃣ If everything is valid, return success
  return res.status(200).json({
    message: "Input accepted",
    received_data: req.body
  });

}