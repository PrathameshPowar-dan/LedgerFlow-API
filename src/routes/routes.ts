import { Router } from "express";
import userRoutes from "../controllers/user/userRoutes";

const router = Router();

router.use("/users", userRoutes)

export default router;