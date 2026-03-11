import { Router } from "express";
import userRoutes from "../controllers/user/userRoutes";
import accRoutes from "../controllers/acc/accRoutes";

const router = Router();

router.use("/users", userRoutes);
router.use("/acc", accRoutes);

export default router;