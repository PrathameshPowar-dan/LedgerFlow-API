import { Router } from "express";
import userRoutes from "../controllers/user/userRoutes";
import accRoutes from "../controllers/acc/accRoutes";
import TransactionsRoutes from "../controllers/transactions/transactionsRoutes";

const router = Router();

router.use("/users", userRoutes);
router.use("/acc", accRoutes);
router.use("/transaction", TransactionsRoutes);

export default router;