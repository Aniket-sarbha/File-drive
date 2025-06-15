import { Doc, Id } from "../../../../convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FiFile,
  FiMoreVertical,
  FiStar as FiStarHalf,
  FiStar,
  FiTrash,
  FiRotateCcw as FiUndo,
  FiFileText,
  FiEye,
  FiRefreshCw,
} from "react-icons/fi";
import { BiLoaderAlt, BiBrain } from "react-icons/bi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";
import { Protect } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilePreview } from "./preview/file-preview";

export function FileCardActions({
  file,
  isFavorited,
}: {
  file: Doc<"files"> & { url: string | null };
  isFavorited: boolean;
}) {
  const deleteFile = useMutation(api.files.deleteFile);
  const restoreFile = useMutation(api.files.restoreFile);
  const toggleFavorite = useMutation(api.files.toggleFavorite);
  const summarizeFile = useAction(api.summarize.summarizeFile);
  const convertFile = useAction(api.convert.convertFile);
  const { toast } = useToast();
  const me = useQuery(api.users.getMe);

  // For file conversion
  const [conversionLoading, setConversionLoading] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  // Function to handle summarization
  const handleSummarize = async () => {
    try {
      setSummaryLoading(true);
      // Open the summary dialog immediately so the loading state is visible
      setIsSummaryOpen(true);
      
      console.log("Starting summarization for file:", file._id);
      await summarizeFile({
        fileId: file._id,
      });
      toast({
        title: "File summarized with Gemini",
        description: "Your file has been summarized successfully",
      });
    } catch (error) {
      console.error("Summarization error:", error);
      
      let errorMessage = "There was an error summarizing your file with Gemini";
        if (error instanceof Error) {
        if (error.message.includes("API key")) {
          errorMessage = "Gemini API key not configured or invalid";
        } else if (error.message.includes("quota") || error.message.includes("QUOTA")) {
          errorMessage = "Gemini API quota exceeded. Please wait and try again later, or upgrade your API plan.";
        } else if (error.message.includes("rate limit") || error.message.includes("RATE_LIMIT")) {
          errorMessage = "Too many requests. Please wait a moment before trying again.";
        } else if (error.message.includes("too short")) {
          errorMessage = "File content is too short to generate a meaningful summary";
        } else if (error.message.includes("not available")) {
          errorMessage = "File content extraction not available for this file type";
        } else if (error.message.includes("SAFETY")) {
          errorMessage = "Content blocked by safety filters";
        } else if (error.message.includes("INVALID_ARGUMENT")) {
          errorMessage = "File content is too large or contains invalid characters";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        variant: "destructive",
        title: "Summarization failed",
        description: errorMessage,
      });
      
      // Close the summary dialog if there's an error
      setIsSummaryOpen(false);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Function to handle file conversion
  const handleConvert = async (targetFormat: "pdf" | "docx") => {
    try {
      setConversionLoading(true);
      
      const result = await convertFile({
        fileId: file._id,
        targetFormat,
      });
      
      if (result && result.success) {
        toast({
          title: "File conversion successful",
          description: `Converted ${file.type} to ${targetFormat}. The new file is saved alongside the original.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Conversion failed",
          description: result && result.message ? result.message : "There was an error converting your file",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Conversion failed",
        description: "There was an error converting your file",
      });
    } finally {
      setConversionLoading(false);
    }
  };

  // Get the file with summary if available
  const fileWithSummary = useQuery(api.files.getFileById, { fileId: file._id });

  return (
    <>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark the file for our deletion process. Files are
              deleted periodically
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await deleteFile({
                  fileId: file._id,
                });
                toast({
                  variant: "default",
                  title: "File marked for deletion",
                  description: "Your file will be deleted soon",
                });
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Summary Dialog */}
      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Summary of {file.name}</DialogTitle>
            <DialogDescription>
              AI-generated summary using Google Gemini
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[300px] overflow-y-auto">
            {summaryLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="relative w-16 h-16">
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-gray-200"></div>
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                  <BiBrain className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500" />
                </div>
                <div className="text-center">
                  <div className="text-lg font-medium">Summarising...</div>
                  <div className="text-sm text-gray-500">Generating insights with AI</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {fileWithSummary?.summary ? 
                  fileWithSummary.summary
                    .split('**')
                    .map((part, index) => 
                      index % 2 === 1 ? 
                        <strong key={index} className="block text-base text-black my-2">{part}</strong> : 
                        <span key={index} style={{whiteSpace: 'pre-line'}}>{part}</span>
                    )
                  : 
                  "No summary available. Click 'Summarize' to generate one."
                }
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      <FilePreview file={file} isOpen={isPreviewOpen} onOpenChange={setIsPreviewOpen} />

      <DropdownMenu>
        <DropdownMenuTrigger>
          <FiMoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {/* Preview option - available for all file types */}
          <DropdownMenuItem
            onClick={() => setIsPreviewOpen(true)}
            className="flex gap-1 items-center cursor-pointer"
          >
            <FiEye className="w-4 h-4" /> Preview
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => {
              if (!file.url) return;
              window.open(file.url, "_blank");
            }}
            className="flex gap-1 items-center cursor-pointer"
          >
            <FiFile className="w-4 h-4" /> Download
          </DropdownMenuItem>

          {/* Conversion options */}
          {file.type === "pdf" && (
            <DropdownMenuItem
              onClick={() => handleConvert("docx")}
              disabled={conversionLoading}
              className="flex gap-2 items-center cursor-pointer"
            >
              {conversionLoading ? (
                <>
                  <BiLoaderAlt className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-blue-500">Converting...</span>
                </>
              ) : (
                <>
                  <FiRefreshCw className="w-4 h-4" /> 
                  <span>Convert to DOCX</span>
                </>
              )}
            </DropdownMenuItem>
          )}
          
          {file.type === "docx" && (
            <DropdownMenuItem
              onClick={() => handleConvert("pdf")}
              disabled={conversionLoading}
              className="flex gap-2 items-center cursor-pointer"
            >
              {conversionLoading ? (
                <>
                  <BiLoaderAlt className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-blue-500">Converting...</span>
                </>
              ) : (
                <>
                  <FiRefreshCw className="w-4 h-4" /> 
                  <span>Convert to PDF</span>
                </>
              )}
            </DropdownMenuItem>
          )}

          {/* Summarize option */}
          {(file.type === "pdf" || file.type === "csv") && (
            <DropdownMenuItem
              onClick={handleSummarize}
              disabled={summaryLoading}
              className="flex gap-2 items-center cursor-pointer"
            >
              {summaryLoading ? (
                <>
                  <BiLoaderAlt className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-blue-500">Summarising...</span>
                </>
              ) : (
                <>
                  <BiBrain className="w-4 h-4" /> 
                  <span>Summarize with Gemini</span>
                </>
              )}
            </DropdownMenuItem>
          )}
          
          {/* View Summary option - only show if the file has a summary */}
          {fileWithSummary?.summary && (
            <DropdownMenuItem
              onClick={() => setIsSummaryOpen(true)}
              className="flex gap-1 items-center cursor-pointer"
            >
              <FiFileText className="w-4 h-4" /> View Summary
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => {
              toggleFavorite({
                fileId: file._id,
              });
            }}
            className="flex gap-1 items-center cursor-pointer"
          >
            {isFavorited ? (
              <div className="flex gap-1 items-center">
                <FiStar className="w-4 h-4 fill-amber-400 text-amber-400" /> Unfavorite
              </div>
            ) : (
              <div className="flex gap-1 items-center">
                <FiStarHalf className="w-4 h-4" /> Favorite
              </div>
            )}
          </DropdownMenuItem>

          <Protect
            condition={(check) => {
              return (
                check({
                  role: "org:admin",
                }) || file.userId === me?._id
              );
            }}
            fallback={<></>}
          >
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (file.shouldDelete) {
                  restoreFile({
                    fileId: file._id,
                  });
                } else {
                  setIsConfirmOpen(true);
                }
              }}
              className="flex gap-1 items-center cursor-pointer"
            >
              {file.shouldDelete ? (
                <div className="flex gap-1 text-green-600 items-center cursor-pointer">
                  <FiUndo className="w-4 h-4" /> Restore
                </div>
              ) : (
                <div className="flex gap-1 text-red-600 items-center cursor-pointer">
                  <FiTrash className="w-4 h-4" /> Delete
                </div>
              )}
            </DropdownMenuItem>
          </Protect>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
