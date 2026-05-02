import { Router, type IRouter } from "express";
import healthRouter from "./health";
import lakersRouter from "./lakers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(lakersRouter);

export default router;
