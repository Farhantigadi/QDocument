import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import documentsRouter from "./documents";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";
import storageRouter from "./storage";
import vaultRouter from "./vault";
import feedbackRouter from "./feedback";
import shareRouter from "./share";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(documentsRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(storageRouter);
router.use(vaultRouter);
router.use(feedbackRouter);
router.use(shareRouter);

export default router;
