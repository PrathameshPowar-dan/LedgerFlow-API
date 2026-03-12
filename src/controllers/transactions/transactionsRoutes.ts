import { Router } from "express";
import Auth from "../../middleware/auth";
import { createTransaction } from "./transactions.controller";

const router = Router();

router.post("/create", Auth, createTransaction)

export default router;