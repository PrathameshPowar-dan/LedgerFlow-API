import { Router } from "express";
import { AuthToken } from "../../middleware/auth";
import { CreateACC, getUserAccounts, getAccountBalance } from "./acc.controller";

const router = Router();

router.post("/create", AuthToken, CreateACC);
router.get("/all", AuthToken, getUserAccounts);
router.get("/balance/:accountId", AuthToken, getAccountBalance);

export default router;