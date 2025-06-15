// Utility to check Gemini API quota status and PDF parsing
"use node";

import { action } from "./_generated/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Test PDF parsing
let pdfParse: any;
try {
  pdfParse = require("pdf-parse");
} catch (error) {
  console.warn("pdf-parse not available in test:", error);
}

export const checkGeminiQuota = action({
  args: {},
  handler: async () => {
    console.log("Checking Gemini API quota...");
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not found in environment");
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Simple test request
      const result = await model.generateContent("Hello, test message");
      const response = result.response;
      const text = response.text();
      
      console.log("Gemini API quota check successful!");
      return { 
        success: true, 
        message: "API is working normally",
        response: text,
        pdfParseAvailable: !!pdfParse
      };
    } catch (error) {
      console.error("Gemini API quota check failed:", error);
      
      if (error instanceof Error) {
        if (error.message.includes("quota") || error.message.includes("QUOTA") || 
            error.message.includes("RESOURCE_EXHAUSTED") || error.message.includes("429")) {
          return {
            success: false,
            message: "Quota exceeded - please wait or upgrade your plan",
            error: error.message,
            pdfParseAvailable: !!pdfParse
          };
        } else if (error.message.includes("RATE_LIMIT")) {
          return {
            success: false,
            message: "Rate limit exceeded - please wait before trying again",
            error: error.message,
            pdfParseAvailable: !!pdfParse
          };
        }
      }
      
      return {
        success: false,
        message: "API check failed",
        error: error instanceof Error ? error.message : String(error),
        pdfParseAvailable: !!pdfParse
      };
    }
  },
});
