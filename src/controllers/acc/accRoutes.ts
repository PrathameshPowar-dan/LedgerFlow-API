import { Router } from "express";
import Auth from "../../middleware/auth";
import { CreateACC } from "./acc.controller";

const router = Router();

router.post("/create", Auth, CreateACC);

export default router;