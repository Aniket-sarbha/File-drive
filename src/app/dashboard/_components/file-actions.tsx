import { Doc, Id } from "../../../../convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileIcon,
  MoreVertical,
  StarHalf,
  StarIcon,
  TrashIcon,
  UndoIcon,
  FileTextIcon,
  Brain,
  Loader2,
} from "lucide-react";
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
  const { toast } = useToast();
  const me = useQuery(api.users.getMe);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Function to handle summarization
  const handleSummarize = async () => {
    try {
      setSummaryLoading(true);
      // Open the summary dialog immediately so the loading state is visible
      setIsSummaryOpen(true);
      
      await summarizeFile({
        fileId: file._id,
      });
      toast({
        title: "File summarized with Gemini",
        description: "Your file has been summarized successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Summarization failed",
        description: "There was an error summarizing your file with Gemini",
      });
    } finally {
      setSummaryLoading(false);
      // No need to set isSummaryOpen here since we already opened it
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
                  <Brain className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500" />
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

      <DropdownMenu>
        <DropdownMenuTrigger>
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => {
              if (!file.url) return;
              window.open(file.url, "_blank");
            }}
            className="flex gap-1 items-center cursor-pointer"
          >
            <FileIcon className="w-4 h-4" /> Download
          </DropdownMenuItem>

          {/* Summarize option */}
          {(file.type === "pdf" || file.type === "csv") && (
            <DropdownMenuItem
              onClick={handleSummarize}
              disabled={summaryLoading}
              className="flex gap-2 items-center cursor-pointer"
            >
              {summaryLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-blue-500">Summarising...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" /> 
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
              <FileTextIcon className="w-4 h-4" /> View Summary
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
                <StarIcon className="w-4 h-4" /> Unfavorite
              </div>
            ) : (
              <div className="flex gap-1 items-center">
                <StarHalf className="w-4 h-4" /> Favorite
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
                  <UndoIcon className="w-4 h-4" /> Restore
                </div>
              ) : (
                <div className="flex gap-1 text-red-600 items-center cursor-pointer">
                  <TrashIcon className="w-4 h-4" /> Delete
                </div>
              )}
            </DropdownMenuItem>
          </Protect>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
