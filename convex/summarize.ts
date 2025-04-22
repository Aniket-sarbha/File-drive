// Use Node.js runtime for pdf-parse compatibility
"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { internal, api } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
// We'll import the PDF parser in a safe way
const pdfParseLib = require("pdf-parse/lib/pdf-parse.js");
// Import mammoth for DOCX parsing
const mammoth = require("mammoth");

// Initialize Gemini only if API key is available
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
  : null;

// Safe wrapper for pdf-parse that avoids initialization issues
async function safeParsePdf(buffer: Buffer): Promise<{ text: string }> {
  try {
    return await pdfParseLib(buffer);
  } catch (error) {
    console.error("PDF parsing error:", error);
    return { text: "Failed to parse PDF content" };
  }
}

/**
 * Generates a summary using Gemini API
 */
async function generateGeminiSummary(content: string, fileType: string): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini API key is not configured");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" });
    // Updated prompt for clearer heading/content separation
    const prompt = `Please summarize the key points of the following ${fileType} file content. Use clear headings for each section on their own line, followed by bullet points for the details under each heading. Ensure there is good separation between sections for readability:\n\n${content}`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    return text || "Failed to generate summary.";
  } catch (error) {
    console.error("Error generating Gemini summary:", error);
    throw new Error("Failed to generate summary with Gemini");
  }
}

/**
 * Reads file content, extracts text (with pdf-parse for PDFs), and generates summary
 */
export const summarizeFile = action({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args): Promise<string> => {
    const file: Doc<"files"> & { url: string | null } = await ctx.runQuery(api.files.getFileById, {
      fileId: args.fileId,
    });

    if (!file) {
      throw new Error("File not found");
    }

    const url = await ctx.storage.getUrl(file.fileId);
    if (!url) {
      throw new Error("File URL not available");
    }

    const response = await fetch(url);
    let textContent = "";

    // Extract content based on file type
    if (file.type === "pdf") {
      const buffer = await response.arrayBuffer();
      const pdfData = await safeParsePdf(Buffer.from(buffer));
      textContent = pdfData.text;
    } else if (file.type === "csv") {
      textContent = await response.text();
    } else if (file.type === "docx") {
      const arrayBuffer = await response.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      textContent = result.value;
    } else {
      // Image or other types (OCR placeholder)
      textContent = "Image file: " + file.name;
    }

    // Limit content to avoid exceeding token limits
    const truncatedContent = textContent.slice(0, 6000);

    try {
      if (!genAI) {
        throw new Error("Gemini API is not configured. Please add GEMINI_API_KEY to your environment variables.");
      }

      const summary = await generateGeminiSummary(truncatedContent, file.type);

      await ctx.runMutation(internal.mutations.updateFileSummary, {
        fileId: args.fileId,
        summary,
      });

      return summary;
    } catch (error) {
      console.error("Error generating summary:", error);
      throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
