// Use Node.js runtime for pdf-parse compatibility
"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { internal, api } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
// We'll import the PDF parser in a safe way
let pdfParse: any = null;

// Try to import pdf-parse safely
try {
  pdfParse = require("pdf-parse");
  console.log("pdf-parse imported successfully");
} catch (error) {
  console.warn("pdf-parse not available:", error);
  pdfParse = null;
}

// Use pdfjs-dist instead, which is more compatible with serverless environments
let pdfjsLib: any;
try {
  pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
  console.log("pdfjs-dist imported successfully");
} catch (error) {
  console.warn("pdfjs-dist not available:", error);
  pdfjsLib = null;
}

// Alternative PDF parsing using pdf2json if pdf-parse fails
let pdf2json: any;
try {
  pdf2json = require("pdf2json");
  console.log("pdf2json available as fallback");
} catch (error) {
  console.warn("pdf2json not available:", error);
  pdf2json = null;
}

// Try pdf-extraction as another option
let pdfExtraction: any;
try {
  pdfExtraction = require("pdf-extraction");
  console.log("pdf-extraction available as option");
} catch (error) {
  console.warn("pdf-extraction not available:", error);
  pdfExtraction = null;
}

let docx4js: any;

// Try to import docx4js safely  
try {
  docx4js = require("docx4js");
  console.log("docx4js imported successfully");
} catch (error) {
  console.warn("docx4js not available:", error);
  docx4js = null;
}

// Initialize Gemini only if API key is available
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Check if extracted PDF text appears to be corrupted or garbled
 */
function isTextCorrupted(text: string): boolean {
  if (!text || text.length < 10) return true;
  
  // Check for high ratio of non-printable or unusual characters
  const printableChars = text.match(/[a-zA-Z0-9\s.,!?;:()\-"']/g);
  const printableRatio = printableChars ? printableChars.length / text.length : 0;
  
  // If less than 60% of characters are printable, consider it corrupted
  if (printableRatio < 0.6) return true;
  
  // Check for repetitive patterns that indicate extraction errors
  const repetitivePattern = /(.)\1{10,}/g;
  if (repetitivePattern.test(text)) return true;
  
  // Check for excessive special characters or encoding issues
  const specialCharRatio = (text.match(/[^\w\s.,!?;:()\-"']/g) || []).length / text.length;
  if (specialCharRatio > 0.4) return true;
  
  return false;
}

// Safe wrapper for PDF parsing that works in Convex environment
async function safeParsePdf(buffer: Buffer): Promise<{ text: string }> {
  console.log("=== PDF PARSING DEBUG START ===");
  console.log("Buffer size:", buffer.length);
  console.log("pdf-parse available:", !!pdfParse);
  console.log("pdf2json available:", !!pdf2json);
  console.log("pdfjs-dist available:", !!pdfjsLib);
  
  if (buffer.length === 0) {
    console.error("❌ Empty PDF buffer");
    return { text: "PDF file appears to be empty or corrupted." };
  }
  
  // Try pdf-parse first (most reliable)
  if (pdfParse) {
    try {
      console.log("🔄 Attempting PDF parsing with pdf-parse...");
      const data = await pdfParse(buffer);
      
      if (data.text && data.text.trim().length > 10) {
        console.log("✅ PDF parsing successful with pdf-parse!");
        console.log("Extracted text length:", data.text.length);
        console.log("Text preview:", data.text.substring(0, 200));
        return { text: data.text.trim() };
      } else {
        console.warn("⚠️ pdf-parse returned empty or minimal text");
      }
    } catch (error) {
      console.error("❌ pdf-parse failed:", error);
    }
  }
  
  // Try pdf-extraction if available
  if (pdfExtraction && !pdfParse) {
    try {
      console.log("🔄 Attempting PDF parsing with pdf-extraction...");
      const extractedText = await pdfExtraction.extract(buffer);
      
      if (extractedText && extractedText.text && extractedText.text.trim().length > 10) {
        console.log("✅ PDF parsing successful with pdf-extraction!");
        return { text: extractedText.text.trim() };
      }
    } catch (error) {
      console.error("❌ pdf-extraction failed:", error);
    }
  }
  
  // Try pdfjs-dist if available
  if (pdfjsLib) {
    try {
      console.log("🔄 Attempting PDF parsing with pdfjs-dist...");
      
      const document = await pdfjsLib.getDocument({
        data: buffer,
        verbosity: 0
      }).promise;
      
      const numPages = document.numPages;
      console.log("📄 PDF has", numPages, "pages");
      
      let fullText = "";
      for (let i = 1; i <= numPages; i++) {
        const page = await document.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
          
        fullText += pageText + "\n";
      }
      
      if (fullText.trim().length > 10) {
        console.log("✅ PDF parsing successful with pdfjs-dist!");
        return { text: fullText.trim() };
      }
      
    } catch (error) {
      console.error("❌ pdfjs-dist failed:", error);
    }
  }
  
  // Try pdf2json as fallback
  if (pdf2json) {
    try {
      console.log("🔄 Attempting PDF parsing with pdf2json...");
      return new Promise((resolve, reject) => {
        const pdfParser = new pdf2json();
        
        pdfParser.on("pdfParser_dataError", (errData: any) => {
          console.error("❌ pdf2json parsing error:", errData);
          reject(errData);
        });
        
        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
          try {
            let text = "";
            
            if (pdfData.Pages) {
              for (const page of pdfData.Pages) {
                if (page.Texts) {
                  for (const textItem of page.Texts) {
                    if (textItem.R) {
                      for (const run of textItem.R) {
                        if (run.T) {
                          text += decodeURIComponent(run.T) + " ";
                        }
                      }
                    }
                  }
                  text += "\n";
                }
              }
            }
            
            if (text.trim().length > 10) {
              console.log("✅ PDF parsing successful with pdf2json!");
              resolve({ text: text.trim() });
            } else {
              console.warn("⚠️ pdf2json returned empty or minimal text");
              reject(new Error("No text extracted"));
            }
          } catch (error) {
            console.error("❌ pdf2json text processing failed:", error);
            reject(error);
          }
        });
        
        pdfParser.parseBuffer(buffer);
      });
    } catch (error) {
      console.error("❌ pdf2json failed:", error);
    }
  }
    // Improved basic text extraction as last resort
  console.log("🔄 Attempting improved basic PDF text extraction...");
  try {
    const bufferString = buffer.toString('binary');
    
    // Multiple strategies for text extraction
    let extractedText = "";
    
    // Strategy 1: Look for text between parentheses (PDF text objects)
    const textMatches = bufferString.match(/\(([^)]*)\)/g);
    if (textMatches && textMatches.length > 0) {
      const filteredText = textMatches
        .map(match => {
          let text = match.slice(1, -1);
          // Handle common PDF escape sequences
          text = text.replace(/\\n/g, ' ').replace(/\\r/g, ' ').replace(/\\t/g, ' ');
          text = text.replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\\/g, '\\');
          return text;
        })
        .filter(text => {
          // Filter out non-readable text more intelligently
          if (text.length < 2) return false;
          
          // Must contain some letters or numbers
          if (!/[a-zA-Z0-9]/.test(text)) return false;
          
          // Exclude text that's mostly special characters or control chars
          const alphanumericRatio = (text.match(/[a-zA-Z0-9\s]/g) || []).length / text.length;
          return alphanumericRatio > 0.5;
        })
        .join(' ');
      
      if (filteredText.length > 20) {
        extractedText = filteredText;
      }
    }
    
    // Strategy 2: Look for text after BT (Begin Text) operators
    if (!extractedText) {
      const btMatches = bufferString.match(/BT\s+.*?ET/gs);
      if (btMatches) {
        for (const match of btMatches) {
          const textInBt = match.match(/\(([^)]*)\)/g);
          if (textInBt) {
            const btText = textInBt
              .map(t => {
                let text = t.slice(1, -1);
                text = text.replace(/\\n/g, ' ').replace(/\\r/g, ' ').replace(/\\t/g, ' ');
                text = text.replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\\/g, '\\');
                return text;
              })
              .filter(t => t.length > 1 && /[a-zA-Z0-9]/.test(t))
              .join(' ');
            extractedText += btText + ' ';
          }
        }
      }
    }
    
    // Strategy 3: Look for stream content with better parsing
    if (!extractedText) {
      const streamMatches = bufferString.match(/stream\s+(.*?)\s+endstream/gs);
      if (streamMatches) {
        for (const match of streamMatches) {
          let streamContent = match.replace(/^stream\s+/, '').replace(/\s+endstream$/, '');
          
          // Try to decode if it looks like it might be compressed
          try {
            // Look for text patterns in the stream
            const textInStream = streamContent.match(/\(([^)]*)\)/g);
            if (textInStream) {
              const streamText = textInStream
                .map(t => {
                  let text = t.slice(1, -1);
                  text = text.replace(/\\n/g, ' ').replace(/\\r/g, ' ').replace(/\\t/g, ' ');
                  text = text.replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\\/g, '\\');
                  return text;
                })
                .filter(t => t.length > 1 && /[a-zA-Z0-9]/.test(t))
                .join(' ');
              extractedText += streamText + ' ';
            }
          } catch (e) {
            // Continue with next strategy
          }
        }
      }
    }
    
    // Clean up the extracted text
    if (extractedText) {
      extractedText = extractedText
        .replace(/\s+/g, ' ')  // Multiple spaces to single space
        .replace(/[^\x20-\x7E\s]/g, '')  // Remove non-printable ASCII chars
        .trim();
    }
    
    if (extractedText.length > 20) {
      console.log("✅ Improved basic extraction successful!");
      return { text: extractedText };
    }
    
  } catch (error) {
    console.error("❌ Improved basic extraction failed:", error);
  }
  
  // If all methods fail
  console.error("❌ All PDF parsing methods failed");
  return { 
    text: "Unable to extract text from this PDF file. This may be an image-based PDF, password-protected, or corrupted. Please try uploading a different PDF file or convert it to a text format first." 
  };
}

/**
 * Generates a summary using Gemini API
 */
async function generateGeminiSummary(
  content: string,
  fileType: string
): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini API key is not configured");
  }
  
  try {
    console.log("Initializing Gemini model...");
    
    // Use a more efficient model for better quota management
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // Faster and more quota-friendly model
      generationConfig: { 
        temperature: 0.2,
        maxOutputTokens: 1000, // Limit output to save quota
      },
    });
      // Optimize content length to save quota
    const optimizedContent = content.slice(0, 3000); // Reduce input size      // Improved prompt that handles extracted content
    let prompt;
    if (fileType === "pdf") {
      if (optimizedContent.includes("Unable to extract text") || 
          optimizedContent.includes("appears to be empty") ||
          optimizedContent.includes("image-based PDF") ||
          optimizedContent.includes("password-protected") ||
          optimizedContent.includes("corrupted")) {
        // Handle PDF parsing errors gracefully
        prompt = `The PDF file could not be processed due to technical limitations. Please respond with: "I apologize, but I cannot summarize this PDF file because the text content could not be extracted. This may be because the PDF is image-based, password-protected, or uses a format that cannot be processed. Please try converting the PDF to a text document or uploading a different file format."`;
      } else if (optimizedContent.length < 50) {
        prompt = `This PDF appears to contain very little text content. Please respond with: "This PDF file appears to contain minimal text content that can be summarized. The file may be primarily image-based or contain mostly non-text elements."`;
      } else {
        // Clean up the extracted text before summarizing
        const cleanedContent = optimizedContent
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/[^\w\s.,!?;:()\-"']/g, '') // Remove weird characters but keep punctuation
          .trim();
        
        if (cleanedContent.length < 50) {
          prompt = `This PDF file appears to contain garbled or corrupted text. Please respond with: "I cannot provide a meaningful summary because the PDF text appears to be corrupted or unreadable. Please try uploading a different PDF file."`;
        } else {
          prompt = `Please summarize this PDF content in 3-4 key points. The text has been extracted from a PDF file and may contain some formatting artifacts:\n\n${cleanedContent}`;
        }
      }
    } else {
      prompt = `Summarize this ${fileType} content in 3-4 key points:\n\n${optimizedContent}`;
    }
    
    console.log("Sending request to Gemini API...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from Gemini API");
    }
      console.log("Received response from Gemini API, length:", text.length);
    return text;
  } catch (error) {
    console.error("Error generating Gemini summary:", error);
    if (error instanceof Error) {
      // Check for specific API errors with more detailed handling
      if (error.message.includes("API key") || error.message.includes("API_KEY")) {
        throw new Error("Invalid or missing Gemini API key");
      } else if (error.message.includes("quota") || error.message.includes("QUOTA") || 
                 error.message.includes("RESOURCE_EXHAUSTED") || error.message.includes("429")) {
        throw new Error("Gemini API quota exceeded. Please try again later or upgrade your API plan.");
      } else if (error.message.includes("SAFETY")) {
        throw new Error("Content blocked by Gemini safety filters");
      } else if (error.message.includes("RATE_LIMIT") || error.message.includes("rate limit")) {
        throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
      } else if (error.message.includes("INVALID_ARGUMENT")) {
        throw new Error("Invalid request format or content too long");
      }
    }
    throw new Error("Failed to generate summary with Gemini");
  }
}

// Rate limiting to prevent quota exhaustion
const lastRequestTime = new Map<string, number>();
const RATE_LIMIT_MS = 30000; // 30 seconds between requests per file

function checkRateLimit(fileId: string): boolean {
  const now = Date.now();
  const lastTime = lastRequestTime.get(fileId) || 0;
  
  if (now - lastTime < RATE_LIMIT_MS) {
    const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastTime)) / 1000);
    throw new Error(`Rate limit: Please wait ${waitTime} seconds before summarizing this file again`);
  }
  
  lastRequestTime.set(fileId, now);
  return true;
}

/**
 * Reads file content, extracts text (with pdf-parse for PDFs), and generates summary
 */
export const summarizeFile = action({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args): Promise<string> => {
    console.log("Starting summarization for file:", args.fileId);
    
    // Apply rate limiting
    checkRateLimit(args.fileId);
    
    const file: Doc<"files"> & { url: string | null } = await ctx.runQuery(
      api.files.getFileById,
      {
        fileId: args.fileId,
      }
    );    if (!file) {
      console.error("File not found:", args.fileId);
      throw new Error("File not found");
    }
    
    // Temporarily disabled for testing - Check if summary already exists to avoid re-processing
    // if (file.summary && file.summary.trim().length > 0) {
    //   console.log("Summary already exists for file:", args.fileId);
    //   return file.summary;
    // }

    const url = await ctx.storage.getUrl(file.fileId);
    if (!url) {
      console.error("File URL not available for:", args.fileId);
      throw new Error("File URL not available");
    }    console.log("File URL obtained, fetching content...");
    const response = await fetch(url);
    let textContent = "";
    
    // Extract content based on file type
    try {
      if (file.type === "pdf") {
        console.log("Processing PDF file:", file.name);
        try {
          const buffer = await response.arrayBuffer();
          console.log("PDF buffer obtained, size:", buffer.byteLength);
          
          if (buffer.byteLength === 0) {
            throw new Error("PDF file is empty");
          }
          
          if (buffer.byteLength < 1000) {
            console.warn("PDF file is very small, might be corrupted");
          }
            const pdfData = await safeParsePdf(Buffer.from(buffer));
          textContent = pdfData.text;
          console.log("PDF processing complete. Content length:", textContent.length);
          console.log("Content preview:", textContent.substring(0, 100) + "...");
          
          // Check if the extracted text appears corrupted
          if (isTextCorrupted(textContent)) {
            console.warn("⚠️ Extracted PDF text appears corrupted");
            textContent = "The PDF text appears to be corrupted or unreadable. This may be due to the PDF format, encoding issues, or the file being primarily image-based.";
          }
          
        } catch (error) {
          console.error("PDF processing error:", error);
          textContent = `Error processing PDF file "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      } else if (file.type === "csv") {
        console.log("Processing CSV file");
        textContent = await response.text();
        console.log("CSV text extracted, length:", textContent.length);
      } else if (file.type === "docx") {
        console.log("Processing DOCX file");
        // For now, just use filename for DOCX files
        textContent = `DOCX file (${file.name}): Document content extraction not yet implemented for DOCX files.`;
      } else {
        // Image or other types (OCR placeholder)
        console.log("Processing image/other file type");
        textContent = `${file.type.toUpperCase()} file (${file.name}): Content extraction not available for this file type.`;
      }    } catch (error) {
      console.error("Error extracting content from file:", error);
      throw new Error(`Failed to extract content from file: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Limit content to avoid exceeding token limits and save quota
    const truncatedContent = textContent.slice(0, 3000); // Reduced from 6000 for better quota management
    console.log("Content truncated to:", truncatedContent.length, "characters");

    // Check if we have meaningful content to summarize
    if (truncatedContent.trim().length < 50) {
      throw new Error("File content is too short or empty to generate a meaningful summary");
    }    try {
      if (!genAI) {
        console.error("Gemini API not configured");
        throw new Error(
          "Gemini API is not configured. Please add GEMINI_API_KEY to your environment variables."
        );
      }

      console.log("Generating summary with Gemini...");
      const summary = await generateGeminiSummary(truncatedContent, file.type);
      console.log("Summary generated successfully, length:", summary.length);

      console.log("Updating file with summary...");
      await ctx.runMutation(internal.mutations.updateFileSummary, {
        fileId: args.fileId,
        summary,
      });

      console.log("File summary updated successfully");
      return summary;
    } catch (error) {
      console.error("Error generating summary:", error);
      throw new Error(
        `Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});
