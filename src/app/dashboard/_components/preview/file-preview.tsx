import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Doc } from "../../../../../convex/_generated/dataModel";
import Image from "next/image";
import { 
  FileTextIcon, 
  GanttChartIcon, 
  ImageIcon,
  FileIcon,
  FileSpreadsheetIcon,
  DownloadIcon,
  XIcon,
  ZoomInIcon, 
  ZoomOutIcon,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilePreviewProps {
  file: Doc<"files"> & { url: string | null };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilePreview({ file, isOpen, onOpenChange }: FilePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Function to handle zoom in
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  
  // Function to handle zoom out
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));

  // Get file extension for proper type badge
  const fileExtension = file.name.split('.').pop()?.toUpperCase() || '';
  
  // Get badge color based on file type
  const getTypeBadgeColor = () => {
    switch (file.type) {
      case 'image': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pdf': return 'bg-red-100 text-red-800 border-red-200';
      case 'csv': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Reset zoom level when dialog closes or opens
  const handleOpenChange = (open: boolean) => {
    if (!open) setZoomLevel(1);
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-hidden rounded-lg p-1 sm:p-2">
        <DialogHeader className="px-3 py-2 sm:px-4 sm:py-3 flex flex-row items-center justify-between gap-4 border-b">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex shrink-0">
              {file.type === "image" && <ImageIcon className="h-5 w-5 text-blue-500" />}
              {file.type === "pdf" && <FileTextIcon className="h-5 w-5 text-red-500" />}
              {file.type === "csv" && <FileSpreadsheetIcon className="h-5 w-5 text-green-500" />}
              {!["image", "pdf", "csv"].includes(file.type) && <FileIcon className="h-5 w-5 text-gray-500" />}
            </div>
            <DialogTitle className="text-base sm:text-lg font-medium truncate">
              {file.name}
            </DialogTitle>
            <div className={cn("h-5 px-2 text-xs font-normal border rounded-md inline-flex items-center", getTypeBadgeColor())}>
              {fileExtension}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {file.type === "image" && (
              <>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={zoomOut}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOutIcon className="h-4 w-4" />
                </Button>
                <span className="text-xs w-12 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={zoomIn}
                  disabled={zoomLevel >= 3}
                >
                  <ZoomInIcon className="h-4 w-4" />
                </Button>
              </>
            )}
            {file.url && (
              <a
                href={file.url}
                download={file.name}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="h-7 gap-1">
                  <DownloadIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </a>
            )}
          </div>
        </DialogHeader>
        
        <div className="flex justify-center items-center h-full p-2 sm:p-4 max-h-[calc(90vh-100px)] overflow-auto bg-gray-50 rounded-b-lg">
          {/* Image preview with zoom */}
          {file.type === "image" && file.url && (
            <div className="relative w-full h-full flex justify-center select-none">
              <div style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-in-out' }} className="origin-center">
                <Image
                  src={file.url}
                  alt={file.name}
                  width={800}
                  height={600}
                  className="object-contain max-h-[calc(90vh-120px)]"
                  onLoadingComplete={() => setIsLoading(false)}
                  priority
                />
              </div>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm text-gray-500">Loading image...</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* PDF preview with enhanced styling */}
          {file.type === "pdf" && file.url && (
            <div className="relative w-full h-full min-h-[500px]">
              <iframe 
                src={`${file.url}#toolbar=0&navpanes=0`} 
                className="w-full h-full min-h-[500px] border rounded shadow-sm"
                title={file.name}
                onLoad={() => setIsLoading(false)}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                    <span className="text-sm text-gray-500">Loading PDF...</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* CSV preview with enhanced styling */}
          {file.type === "csv" && file.url && (
            <div className="relative w-full h-full min-h-[500px]">
              <iframe
                src={file.url}
                className="w-full h-full min-h-[500px] border rounded shadow-sm"
                title={file.name}
                onLoad={() => setIsLoading(false)}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                    <span className="text-sm text-gray-500">Loading CSV data...</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Fallback for unsupported file types or when no URL is available */}
          {(!file.url || !["image", "pdf", "csv"].includes(file.type)) && (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              {file.type === "pdf" ? (
                <div className="relative bg-red-50 p-6 rounded-lg mb-4">
                  <FileTextIcon className="w-20 h-20 text-red-500" />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-100 rounded text-xs text-red-800 font-medium">
                    PDF
                  </div>
                </div>
              ) : file.type === "csv" ? (
                <div className="relative bg-green-50 p-6 rounded-lg mb-4">
                  <GanttChartIcon className="w-20 h-20 text-green-500" />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-green-100 rounded text-xs text-green-800 font-medium">
                    CSV
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 mb-4">
                  <FileIcon className="w-12 h-12" />
                </div>
              )}
              <h3 className="text-lg font-medium text-gray-800 mb-2">{file.name}</h3>
              <p className="text-gray-600 mb-6">
                Preview not available for this file type.
              </p>
              {file.url && (
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Download to view
                </a>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}