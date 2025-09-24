import express, { type Router } from "express";
import { create, list, redirect } from "../controllers/orderController";
import { validateRequest } from "../middleware/validation.js";
import { createPaymentSchema } from "../validation/paymentValidation.js";

const router: Router = express.Router();

router.post("/", validateRequest(createPaymentSchema), create);
router.get("/", list);
router.get("/:id/payment-redirect", redirect);

export default router;
