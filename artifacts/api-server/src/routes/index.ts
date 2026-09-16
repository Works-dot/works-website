import { Router, type IRouter } from "express";
import healthRouter from "./health";
import newsletterRouter from "./newsletter";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(newsletterRouter);
router.use(contactRouter);

export default router;
