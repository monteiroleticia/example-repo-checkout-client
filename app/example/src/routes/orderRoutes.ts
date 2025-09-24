import express, { type Router } from "express";
import { create, list, redirect } from "../controllers/orderController";

const router: Router = express.Router();

router.post("/", create);
router.get("/", list);
router.get("/:id/payment-redirect", redirect);

export default router;
