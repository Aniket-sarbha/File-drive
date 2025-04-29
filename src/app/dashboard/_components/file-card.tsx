import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelative } from "date-fns";

import { Doc } from "../../../../convex/_generated/dataModel";
import { 
  FiFileText, 
  FiBarChart2, 
  FiImage,
  FiFile,
  FiFileText as FiFileSpreadsheet,
  FiType as FiFileType2,
  FiCode as FiFileCode,
  FiHash as FiFileDigit, 
  FiBook,
  FiMonitor as FiPresentation,
  FiClipboard,
  FiCheckCircle as FiBadgeCheck,
  FiStar,
  FiVideo,
  FiMusic
} from "react-icons/fi";
import { ReactNode, useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Image from "next/image";
import { FileCardActions } from "./file-actions";
import { FilePreview } from "./preview/file-preview";
import { cn } from "@/lib/utils";

export function FileCard({
  file,
}: {
  file: Doc<"files"> & { isFavorited: boolean; url: string | null; type: "image" | "csv" | "pdf" | "docx" | "doc" | "video" | "audio" };
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const userProfile = useQuery(api.users.getUserProfile, {
    userId: file.userId,
  });

  // Extract file extension for more specific icons
  const fileExtension = useMemo(() => {
    return file.name.split('.').pop()?.toLowerCase() || '';
  }, [file.name]);

  // Enhanced type icons with colors and more file types
  const typeIcons = useMemo(() => {
    return {
      image: <FiImage className="text-blue-500" />,
      pdf: <FiFileText className="text-red-500" />,
      csv: <FiFileSpreadsheet className="text-green-500" />,
      docx: <FiFileType2 className="text-blue-600" />,
      doc: <FiFileType2 className="text-blue-600" />,
      xls: <FiFileSpreadsheet className="text-green-600" />,
      xlsx: <FiFileSpreadsheet className="text-green-600" />,
      ppt: <FiPresentation className="text-orange-600" />,
      pptx: <FiPresentation className="text-orange-600" />,
      txt: <FiFileText className="text-gray-600" />,
      html: <FiFileCode className="text-purple-500" />,
      css: <FiFileCode className="text-blue-400" />,
      js: <FiFileCode className="text-yellow-500" />,
      json: <FiFileCode className="text-gray-600" />,
      zip: <FiFileDigit className="text-orange-500" />,
      mp4: <FiVideo className="text-purple-500" />,
      webm: <FiVideo className="text-purple-500" />,
      ogg: <FiVideo className="text-purple-500" />,
      mov: <FiVideo className="text-purple-500" />,
      mkv: <FiVideo className="text-purple-500" />,
      mp3: <FiMusic className="text-yellow-500" />,
      wav: <FiMusic className="text-yellow-500" />,
      aac: <FiMusic className="text-yellow-500" />,
      video: <FiVideo className="text-purple-500" />,
      audio: <FiMusic className="text-yellow-500" />,
      default: <FiFile className="text-gray-500" />,
    };
  }, []);

  // Get the appropriate icon based on file extension or type
  const getFileIcon = () => {
    if (file.type === 'image') return typeIcons.image;
    if (file.type === 'pdf') return typeIcons.pdf;
    if (file.type === 'csv') return typeIcons.csv;
    if (file.type === 'docx') return typeIcons.docx;
    if (file.type === 'video') return typeIcons.video;
    if (file.type === 'audio') return typeIcons.audio;
    
    // Check more specific file extensions
    if (fileExtension in typeIcons) return typeIcons[fileExtension as keyof typeof typeIcons];
    return typeIcons.default;
  };

  // Background color for file type indicator
  const getTypeBackground = () => {
    switch (file.type) {
      case 'image': return 'bg-blue-50';
      case 'pdf': return 'bg-red-50';
      case 'csv': return 'bg-green-50';
      case 'docx': return 'bg-blue-50';
      case 'video': return 'bg-purple-50';
      case 'audio': return 'bg-yellow-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <>
      <Card 
        className="cursor-pointer group overflow-hidden transition-all duration-300 hover:shadow-lg border-opacity-60 hover:border-opacity-100 hover:border-primary/30"
        onDoubleClick={() => setIsPreviewOpen(true)}
      >
        <CardHeader className="relative p-3 md:p-4 pb-2 md:pb-3 border-b border-gray-100">
          <CardTitle className="flex gap-2 text-sm font-medium truncate pr-8">
            <div className={cn("flex justify-center p-1 rounded-md", getTypeBackground())}>
              {getFileIcon()}
            </div>
            <span className="truncate">{file.name}</span>
          </CardTitle>
          <div className="absolute top-2 right-2">
            {file.isFavorited && (
              <span className="absolute -left-7 top-0">
                <FiStar className="w-4 h-4 text-amber-500 fill-current" />
              </span>
            )}
            <FileCardActions isFavorited={file.isFavorited} file={file} />
          </div>
        </CardHeader>

        <CardContent className="h-[150px] sm:h-[180px] md:h-[200px] flex flex-col justify-center items-center p-2 md:p-4 relative group-hover:opacity-95 transition-opacity">
          {/* Image files - show actual preview */}
          {file.type === "image" && file.url && (
            <>
              <div className="relative w-full h-full flex justify-center items-center overflow-hidden">
                <Image 
                  alt={file.name} 
                  width="200" 
                  height="100" 
                  src={file.url}
                  className="max-h-full max-w-full object-contain rounded transition-transform duration-300 group-hover:scale-105"
                  onLoadingComplete={() => setImageLoaded(true)}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
              <div className="w-full h-full absolute top-0 left-0 bg-gradient-to-b from-transparent via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          )}

          {/* PDF files - show icon and a document preview style */}
          {file.type === "pdf" && (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div className="relative bg-red-50 p-3 rounded-lg mb-2 transition-transform duration-300 group-hover:scale-105">
                <FiFileText className="w-16 h-16 md:w-20 md:h-20 text-red-500" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-100 rounded-md flex items-center justify-center">
                  <span className="text-xs font-medium text-red-600">PDF</span>
                </div>
              </div>
              <div className="space-y-1 w-2/3">
                <div className="h-1 bg-gray-200 rounded w-full"></div>
                <div className="h-1 bg-gray-200 rounded w-4/5"></div>
                <div className="h-1 bg-gray-200 rounded w-3/5"></div>
              </div>
            </div>
          )}
            
            {/* DOCX files - show icon and a document preview style */}
          {file.type === "docx" && (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div className="relative bg-red-50 p-3 rounded-lg mb-2 transition-transform duration-300 group-hover:scale-105">
                <FiFileType2 className="w-16 h-16 md:w-20 md:h-20 text-blue-500" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-100 rounded-md flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">Docx</span>
                </div>
              </div>
              <div className="space-y-1 w-2/3">
                <div className="h-1 bg-gray-200 rounded w-full"></div>
                <div className="h-1 bg-gray-200 rounded w-4/5"></div>
                <div className="h-1 bg-gray-200 rounded w-3/5"></div>
              </div>
            </div>
          )}

          {/* CSV/Spreadsheet files - show icon and a table-like preview */}
          {file.type === "csv" && (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div className="relative bg-green-50 p-3 rounded-lg mb-2 transition-transform duration-300 group-hover:scale-105">
                <FiBarChart2 className="w-16 h-16 md:w-20 md:h-20 text-green-500" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                  <span className="text-xs font-medium text-green-600">CSV</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 w-4/5">
                <div className="h-2 bg-green-100 rounded"></div>
                <div className="h-2 bg-green-100 rounded"></div>
                <div className="h-2 bg-green-100 rounded"></div>
                <div className="h-2 bg-gray-100 rounded"></div>
                <div className="h-2 bg-gray-100 rounded"></div>
                <div className="h-2 bg-gray-100 rounded"></div>
                <div className="h-2 bg-gray-100 rounded"></div>
                <div className="h-2 bg-gray-100 rounded"></div>
                <div className="h-2 bg-gray-100 rounded"></div>
              </div>
            </div>
          )}

          {/* Video files - show icon and a video preview style */}
          {file.type === "video" && (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div className="relative bg-purple-50 p-3 rounded-lg mb-2 transition-transform duration-300 group-hover:scale-105">
                <FiVideo className="w-16 h-16 md:w-20 md:h-20 text-purple-500" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-purple-500 border-b-[6px] border-b-transparent ml-1"></div>
                </div>
                <div className="absolute -top-1 -right-1 w-10 h-6 bg-purple-100 rounded-md flex items-center justify-center">
                  <span className="text-xs font-medium text-purple-600">Video</span>
                </div>
              </div>
              <div className="w-2/3 bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-400 h-full w-1/3"></div>
              </div>
              <div className="flex justify-between w-2/3 mt-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-400"></div>
                </div>
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-400"></div>
                </div>
              </div>
            </div>
          )}

          {/* Audio files - show icon and an audio preview style */}
          {file.type === "audio" && (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div className="relative bg-yellow-50 p-3 rounded-lg mb-2 transition-transform duration-300 group-hover:scale-105">
                <FiMusic className="w-16 h-16 md:w-20 md:h-20 text-yellow-500" />
                <div className="absolute -top-1 -right-1 w-10 h-6 bg-yellow-100 rounded-md flex items-center justify-center">
                  <span className="text-xs font-medium text-yellow-600">Audio</span>
                </div>
              </div>
              {/* Audio waveform visualization */}
              <div className="w-2/3 h-10 flex items-center justify-center gap-1">
                <div className="w-1 h-3 bg-yellow-200 rounded-full"></div>
                <div className="w-1 h-5 bg-yellow-300 rounded-full"></div>
                <div className="w-1 h-7 bg-yellow-400 rounded-full"></div>
                <div className="w-1 h-10 bg-yellow-500 rounded-full"></div>
                <div className="w-1 h-6 bg-yellow-400 rounded-full"></div>
                <div className="w-1 h-8 bg-yellow-500 rounded-full"></div>
                <div className="w-1 h-4 bg-yellow-300 rounded-full"></div>
                <div className="w-1 h-7 bg-yellow-400 rounded-full"></div>
                <div className="w-1 h-9 bg-yellow-500 rounded-full"></div>
                <div className="w-1 h-3 bg-yellow-200 rounded-full"></div>
                <div className="w-1 h-5 bg-yellow-300 rounded-full"></div>
                <div className="w-1 h-8 bg-yellow-400 rounded-full"></div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 px-3 py-2 md:px-4 md:py-3 bg-gray-50/50 border-t border-gray-100">
          <div className="flex gap-2 text-xs text-gray-700 items-center truncate">
            <Avatar className="w-5 h-5 md:w-6 md:h-6 border">
              <AvatarImage src={userProfile?.image} />
              <AvatarFallback>{userProfile?.name?.substring(0, 2) || 'UN'}</AvatarFallback>
            </Avatar>
            <span className="truncate">{userProfile?.name}</span>
          </div>
          <div className="text-xs text-gray-700 truncate">
            {formatRelative(new Date(file._creationTime), new Date())}
          </div>
        </CardFooter>
      </Card>

      {/* File Preview Dialog */}
      <FilePreview file={file} isOpen={isPreviewOpen} onOpenChange={setIsPreviewOpen} />
    </>
  );
}
