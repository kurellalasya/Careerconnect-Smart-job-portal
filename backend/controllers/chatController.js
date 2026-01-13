import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { chatWithAI } from "../services/aiService.js";

export const chat = catchAsyncErrors(async (req, res, next) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return next(new ErrorHandler("Please provide messages array!", 400));
  }

  const response = await chatWithAI(messages);

  res.status(200).json({
    success: true,
    response,
  });
});
