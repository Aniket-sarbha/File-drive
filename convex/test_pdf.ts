// Simple test to verify PDF parsing
"use node";

import { action } from "./_generated/server";

let pdfParse: any;
try {
  pdfParse = require("pdf-parse");
} catch (error) {
  console.warn("pdf-parse not available:", error);
}

export const testPdfParse = action({
  args: {},
  handler: async () => {
    console.log("Testing PDF parsing library...");
    
    if (!pdfParse) {
      return { 
        success: false, 
        error: "pdf-parse library not available",
        installed: false
      };
    }
    
    try {
      // Create a simple test PDF buffer (minimal PDF structure)
      const testPdfData = Buffer.from(
        "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/Contents 4 0 R>>endobj 4 0 obj<</Length 44>>stream\nBT\n/F1 12 Tf\n72 720 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \n0000000179 00000 n \ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n238\n%%EOF"
      );
      
      const result = await pdfParse(testPdfData);
      
      return {
        success: true,
        installed: true,
        hasText: !!result.text,
        textLength: result.text ? result.text.length : 0,
        textContent: result.text || "No text extracted"
      };
    } catch (error) {
      return {
        success: false,
        installed: true,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },
});
