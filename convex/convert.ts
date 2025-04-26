"use node";  // Enable Node.js runtime for this file
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Pre-import the pdf-parse module to control how it's loaded
import pdfParse from 'pdf-parse/lib/pdf-parse';

/**
 * Converts a file between formats (PDF to DOCX or DOCX to PDF)
 * and saves the converted file with the same name alongside the original
 */
export const convertFile = action({
  args: {
    fileId: v.id("files"),
    targetFormat: v.union(v.literal("pdf"), v.literal("docx")),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string; newFileId?: Id<"files"> }> => {
    try {
      // Get the file data
      const file = await ctx.runQuery(api.files.getFileById, {
        fileId: args.fileId,
      });

      if (!file) {
        return { success: false, message: "File not found" };
      }

      // Get file URL
      const url = await ctx.storage.getUrl(file.fileId);
      if (!url) {
        return { success: false, message: "File URL not available" };
      }

      // Fetch the original file content
      const response = await fetch(url);
      const fileBuffer = await response.arrayBuffer();
      
      let convertedBlob: Blob;
      let newFileName: string;
      let newFileType: "pdf" | "docx";
      let contentType: string;

      // Determine conversion direction
      if (file.type === "pdf" && args.targetFormat === "docx") {
        // PDF to DOCX conversion
        newFileName = file.name.replace(/\.pdf$/i, '.docx');
        if (newFileName === file.name) newFileName = `${file.name}.docx`;
        
        newFileType = "docx";
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        
        // Extract text from PDF using the pre-imported module
        const pdfData = await pdfParse(Buffer.from(fileBuffer));
        const extractedText = pdfData.text;
        
        // Create DOCX from extracted text
        const { Document, Packer, Paragraph, TextRun } = await import('docx');
        
        // Create a new document with the extracted text
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun("Converted from PDF document"),
                  new TextRun({ break: 1 }),
                  new TextRun({ break: 1 }),
                ],
              }),
              // Add paragraphs from extracted text
              ...extractedText.split('\n')
                .filter((line: string) => line.trim() !== '')
                .map((line: string) => 
                  new Paragraph({
                    children: [new TextRun(line.trim())]
                  })
                )
            ],
          }],
        });
        
        // Generate DOCX binary
        const docxBuffer = await Packer.toBuffer(doc);
        convertedBlob = new Blob([docxBuffer], { type: contentType });
      } 
      else if (file.type === "docx" && args.targetFormat === "pdf") {
        // DOCX to PDF conversion
        newFileName = file.name.replace(/\.docx$/i, '.pdf');
        if (newFileName === file.name) newFileName = `${file.name}.pdf`;
        
        newFileType = "pdf";
        contentType = "application/pdf";
        
        // Extract HTML from DOCX
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({
          arrayBuffer: fileBuffer
        });
        const extractedText = result.value;
        
        // Create PDF from extracted text
        const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
        
        const pdfDoc = await PDFDocument.create();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
        const { width, height } = page.getSize();
        
        // Add title
        page.drawText("Converted from DOCX document", {
          x: 50,
          y: height - 50,
          size: 16,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        
        // Add content with text wrapping
        const textLines = extractedText.split('\n');
        let y = height - 80;
        const fontSize = 12;
        const lineHeight = fontSize * 1.2;
        
        for (const line of textLines) {
          if (y < 50) { // Add new page if we're near the bottom
            const newPage = pdfDoc.addPage([595.28, 841.89]);
            y = height - 50;
          }
          
          if (line.trim() !== '') {
            page.drawText(line.trim(), {
              x: 50,
              y,
              size: fontSize,
              font: helveticaFont,
              color: rgb(0, 0, 0),
            });
            y -= lineHeight;
          } else {
            y -= lineHeight / 2; // Smaller gap for empty lines
          }
        }
        
        const pdfBytes = await pdfDoc.save();
        convertedBlob = new Blob([pdfBytes], { type: contentType });
      } 
      else {
        return { 
          success: false, 
          message: `Conversion from ${file.type} to ${args.targetFormat} is not supported` 
        };
      }
      
      // Upload the converted file to storage
      const storageId = await ctx.storage.store(convertedBlob);

      if (!storageId) {
        return { success: false, message: "Failed to store converted file" };
      }
      
      // Create a new file entry in the database
      const newFileId = await ctx.runMutation(api.files.createFile, {
        name: newFileName,
        fileId: storageId,
        orgId: file.orgId,
        type: newFileType,
      }) as Id<"files"> | null;

      if (!newFileId) {
        return { success: false, message: "Failed to create file record" };
      }

      return { 
        success: true, 
        message: `Successfully converted ${file.type} to ${args.targetFormat}`,
        newFileId 
      };
    } catch (error) {
      console.error("Conversion error:", error);
      return { 
        success: false, 
        message: `Error during conversion: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  },
});