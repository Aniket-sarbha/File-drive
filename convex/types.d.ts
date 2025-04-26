// Type declarations for modules without .d.ts files
declare module 'pdf-parse/lib/pdf-parse' {
  function pdfParse(dataBuffer: Buffer, options?: any): Promise<{
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }>;
  
  export = pdfParse;
}