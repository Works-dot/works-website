import { Router, type IRouter } from "express";
// The website middleware and the separately deployed API use the same contract.
import { sendContactMessage } from "../../../works-website/contact-server.mjs";

const router: IRouter = Router();
router.post("/contact/send", async (req, res): Promise<void> => {
  const result = await sendContactMessage(req.body, req.log);
  res.status(result.status).json(result.body);
});
export default router;
