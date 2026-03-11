import { Router } from "express";
import Auth from "../../middleware/auth";

const router = Router();

router.use("/", Auth)

export default router;