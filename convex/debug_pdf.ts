// Debug PDF parsing
"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

let pdfParse: any = null;
try {
  pdfParse = require("pdf-parse");
  console.log("pdf-parse loaded successfully");
} catch (error) {
  console.error("pdf-parse loading failed:", error);
}

export const debugPdfParsing = action({
  args: { 
    fileId: v.id("files") 
  },
  handler: async (ctx, args) => {
    console.log("=== PDF DEBUG START ===");
      // Get file info
    const file = await ctx.runQuery(api.files.getFileById, { fileId: args.fileId });
    if (!file) {
      return { error: "File not found" };
    }
    
    console.log("File info:", {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    // Get file URL and fetch content
    const url = await ctx.storage.getUrl(file.fileId);
    if (!url) {
      return { error: "File URL not available" };
    }
    
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const nodeBuffer = Buffer.from(buffer);
    
    console.log("Buffer size:", nodeBuffer.length);
    console.log("Buffer first 100 bytes:", nodeBuffer.subarray(0, 100).toString('hex'));
    
    // Check if it's a valid PDF
    const pdfSignature = nodeBuffer.subarray(0, 4).toString();
    console.log("PDF signature:", pdfSignature);
    
    if (!pdfSignature.startsWith('%PDF')) {
      return { 
        error: "Not a valid PDF file",
        signature: pdfSignature,
        firstBytes: nodeBuffer.subarray(0, 20).toString()
      };
    }
    
    // Try pdf-parse
    if (pdfParse) {
      try {
        console.log("Attempting pdf-parse...");
        const result = await pdfParse(nodeBuffer);
        console.log("pdf-parse result:", {
          textLength: result.text?.length || 0,
          numPages: result.numpages,
          preview: result.text?.substring(0, 200) || "No text"
        });
        
        return {
          success: true,
          method: "pdf-parse",
          textLength: result.text?.length || 0,
          numPages: result.numpages,
          preview: result.text?.substring(0, 500) || "No text extracted"
        };
      } catch (error) {
        console.error("pdf-parse failed:", error);
        return {
          error: "pdf-parse failed",
          details: error instanceof Error ? error.message : String(error)
        };
      }
    } else {
      return { error: "pdf-parse not available" };
    }
  }
});
