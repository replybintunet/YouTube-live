import { Router } from "express";
// import your db client
import { db } from "../db"; // adjust path
import { nanoid } from "nanoid";

const router = Router();

router.post("/", async (req, res) => {
  const { plan, transactionCode } = req.body;

  console.log("Payment request received:", { plan, transactionCode });

  if (!transactionCode) {
    return res.status(400).json({
      error: "Transaction code is required.",
    });
  }

  let validatedPlan = plan;

  if (transactionCode === "bintunet") {
    validatedPlan = plan;
  } else {
    const demoCodes: Record<string, string> = {
      "1": "5hours",
      "2": "12hours",
      "3": "lifetime",
    };

    if (!(transactionCode in demoCodes)) {
      return res.status(400).json({
        error: "Invalid transaction code. Use 'bintunet' for universal access.",
      });
    }

    validatedPlan = demoCodes[transactionCode];
  }

  // ✅ Insert session in DB
  const sessionId = nanoid();
  const expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours by default
  if (validatedPlan === "12hours") {
    expiresAt.setHours(expiresAt.getHours() + 7);
  } else if (validatedPlan === "lifetime") {
    // lifetime = never expires
  }

  try {
    await db.insert("sessions").values({
      id: sessionId,
      plan: validatedPlan,
      expires_at: validatedPlan === "lifetime" ? null : expiresAt,
    });

    return res.json({
      success: true,
      message: `✅ Payment verified and session created for plan: ${validatedPlan}`,
      plan: validatedPlan,
      sessionId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create session" });
  }
});

export default router;