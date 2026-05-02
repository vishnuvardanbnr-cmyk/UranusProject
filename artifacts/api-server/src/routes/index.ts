import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import investmentsRouter from "./investments";
import incomeRouter from "./income";
import teamRouter from "./team";
import withdrawalsRouter from "./withdrawals";
import ranksRouter from "./ranks";
import adminRouter from "./admin";
import supportRouter from "./support";
import depositsRouter from "./deposits";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(investmentsRouter);
router.use(incomeRouter);
router.use(teamRouter);
router.use(withdrawalsRouter);
router.use(ranksRouter);
router.use(adminRouter);
router.use(supportRouter);
router.use(depositsRouter);

export default router;
