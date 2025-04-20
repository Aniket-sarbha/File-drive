"use client";

import { Button } from "@/components/ui/button";
import { useOrganization, useUser } from "@clerk/nextjs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useCallback, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { 
  UploadCloud, 
  File, 
  Loader2, 
  ImageIcon, 
  FileTextIcon, 
  FileSpreadsheetIcon,
  X as XIcon,
  CheckCircle,
  AlertCircle,
  Plus
} from "lucide-react";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";

// File Types - expanded support
const ACCEPTED_FILE_TYPES = {
  "image/png": "image",
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/gif": "image",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/csv": "csv",
} as const;

const MAX_FILE_SIZE = 1024 * 1024 * 20; // 20MB

const formSchema = z.object({
  title: z.string().min(1).max(200),
  file: z
    .custom<FileList>((val) => val instanceof FileList, "Please select a file")
    .refine((files) => files.length > 0, `Please select a file`)
    .refine(
      (files) => files[0] && files[0].size <= MAX_FILE_SIZE,
      `File size should be less than 20MB`
    )
    .refine(
      (files) => 
        files[0] && Object.keys(ACCEPTED_FILE_TYPES).includes(files[0].type),
      `Only PNG, JPEG, JPG, GIF, PDF, DOCX, and CSV files are accepted`
    ),
});

export function UploadButton() {
  const { toast } = useToast();
  const organization = useOrganization();
  const user = useUser();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const joinOrganization = useMutation(api.users.joinOrganization);
  const createFile = useMutation(api.files.createFile);

  // State for drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  // Add a new state for tracking form submission attempt
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      file: undefined,
    },
  });

  const fileRef = form.register("file");

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File) => {
    if (!file) return "Please select a file";
    if (file.size > MAX_FILE_SIZE) return "File size should be less than 20MB";
    if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
      return "Only PNG, JPEG, JPG, GIF, PDF, DOCX, and CSV files are accepted";
    }
    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setFileError(null);
    
    const files = e.dataTransfer.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      const errorMsg = validateFile(file);
      
      if (errorMsg) {
        setFileError(errorMsg);
        return;
      }
      
      // Create a new FileList-like object that the form can use
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const fileList = dataTransfer.files;

      // Update the form
      form.setValue('file', fileList, { shouldValidate: true });
      
      // If it's an image, show a preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
      
      // Set file name for display
      setSelectedFileName(file.name);
      
      // Auto-populate the title field with the file name (without extension)
      const fileName = file.name.split('.').slice(0, -1).join('.');
      form.setValue('title', fileName, { shouldValidate: true });
    }
  }, [form]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = e.target.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      const errorMsg = validateFile(file);
      
      if (errorMsg) {
        setFileError(errorMsg);
        return;
      }
      
      // Create a FileList-like object that the form can use
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const fileList = dataTransfer.files;
      
      // Update the form with the FileList object
      form.setValue('file', fileList, { shouldValidate: true });
      
      // If it's an image, show a preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
      
      // Set file name for display
      setSelectedFileName(file.name);
      
      // Auto-populate the title field with the file name (without extension)
      const fileName = file.name.split('.').slice(0, -1).join('.');
      form.setValue('title', fileName, { shouldValidate: true });
    } else {
      setFilePreview(null);
      setSelectedFileName(null);
    }
  };

  const clearSelectedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFileName(null);
    setFilePreview(null);
    form.setValue('file', undefined as any);

    // Reset the file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Update the onSubmit function to handle validation explicitly
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Reset the attempted submit state
    setAttemptedSubmit(true);
    
    // Check if a file is selected
    if (!values.file || !values.file[0]) {
      setFileError("Please select a file");
      return;
    }

    if (!orgId) return;

    try {
      setUploadStatus('uploading');
      setUploadProgress(10);
      
      // First, ensure the user has access to this organization
      await joinOrganization({ orgId });
      
      setUploadProgress(20);
      const postUrl = await generateUploadUrl();
      
      setUploadProgress(30);
      const fileType = values.file[0].type;

      // Use XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progressPercentage = Math.round((event.loaded / event.total) * 50) + 30;
          setUploadProgress(progressPercentage);
        }
      });
      
      const uploadPromise = new Promise<{ storageId: string }>((resolve, reject) => {
        xhr.open('POST', postUrl);
        xhr.setRequestHeader('Content-Type', fileType);
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error occurred'));
        };
        
        xhr.send(values.file[0]);
      });
      
      const { storageId } = await uploadPromise;
      
      setUploadProgress(85);

      await createFile({
        name: values.title,
        fileId: storageId as unknown as Id<"_storage">,
        orgId,
        type: ACCEPTED_FILE_TYPES[fileType as keyof typeof ACCEPTED_FILE_TYPES] || "other",
      });

      setUploadProgress(100);
      setUploadStatus('success');

      setTimeout(() => {
        form.reset();
        setIsFileDialogOpen(false);
        setUploadStatus('idle');
        setUploadProgress(0);
        setFilePreview(null);
        setSelectedFileName(null);
      }, 1000);

      toast({
        variant: "success",
        title: "File Uploaded Successfully",
        description: "Now everyone can view your file",
      });
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus('error');
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Your file could not be uploaded, try again later",
      });
    }
  }

  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }

  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);

  const getFileIcon = () => {
    if (selectedFileName) {
      const fileExt = selectedFileName.split('.').pop()?.toLowerCase();
      
      if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt || '')) {
        return <ImageIcon className="h-8 w-8 md:h-10 md:w-10 text-blue-500" />;
      } else if (fileExt === 'pdf') {
        return <FileTextIcon className="h-8 w-8 md:h-10 md:w-10 text-red-500" />;
      } else if (['csv', 'xlsx', 'xls'].includes(fileExt || '')) {
        return <FileSpreadsheetIcon className="h-8 w-8 md:h-10 md:w-10 text-green-500" />;
      } else {
        return <File className="h-8 w-8 md:h-10 md:w-10 text-gray-500" />;
      }
    }
    return <UploadCloud className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mb-2" />;
  };

  return (
    <Dialog
      open={isFileDialogOpen}
      onOpenChange={(isOpen) => {
        setIsFileDialogOpen(isOpen);
        if (!isOpen) {
          form.reset();
          setFilePreview(null);
          setSelectedFileName(null);
          setUploadStatus('idle');
          setUploadProgress(0);
          setFileError(null);
          setAttemptedSubmit(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="flex gap-1 items-center whitespace-nowrap">
          <Plus className="h-4 w-4" /> 
          <span className="hidden sm:inline">Upload File</span>
          <span className="sm:hidden">Upload</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-w-[95vw] p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="mb-2 text-center md:text-left">Upload your file</DialogTitle>
          <DialogDescription className="text-center md:text-left">
            Drag and drop your file or click to browse
          </DialogDescription>
        </DialogHeader>

        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
              <FormField
                control={form.control}
                name="file"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <div 
                        className={`border-2 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} 
                                    ${fileError || (attemptedSubmit && !selectedFileName) ? 'border-red-500' : ''}
                                    border-dashed rounded-lg p-4 md:p-6 flex flex-col items-center justify-center cursor-pointer
                                    transition-colors duration-200 ease-in-out`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => {
                          if (!selectedFileName) {
                            document.getElementById('file-upload')?.click();
                          }
                        }}
                      >
                        <input
                          id="file-upload"
                          type="file"
                          className="sr-only"
                          {...fileRef}
                          onChange={handleFileInputChange}
                          accept=".png,.jpg,.jpeg,.gif,.pdf,.docx,.csv"
                        />

                        {filePreview ? (
                          <div className="relative w-32 h-32 md:w-40 md:h-40 mb-2 md:mb-4">
                            <Image
                              src={filePreview}
                              alt="File preview"
                              fill
                              className="object-contain rounded-md"
                            />
                            <button
                              type="button"
                              className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-sm"
                              onClick={clearSelectedFile}
                            >
                              <XIcon className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        ) : (
                          <div className={`flex flex-col items-center ${selectedFileName ? 'py-2 md:py-4' : 'py-4 md:py-8'}`}>
                            {getFileIcon()}
                            {!selectedFileName && (
                              <>
                                <p className="mt-2 text-xs md:text-sm text-center text-gray-500">
                                  <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500 mt-1 text-center px-2">
                                  PNG, JPG, GIF, PDF, DOCX or CSV (max 20MB)
                                </p>
                              </>
                            )}
                          </div>
                        )}

                        {selectedFileName && !filePreview && (
                          <div className="flex items-center mt-2 bg-gray-100 rounded-md p-2 pl-3 pr-2 w-full">
                            <div className="flex-1 truncate text-xs md:text-sm">{selectedFileName}</div>
                            <button
                              type="button"
                              className="ml-2 bg-white rounded-full p-1 border border-gray-300"
                              onClick={clearSelectedFile}
                            >
                              <XIcon className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                            </button>
                          </div>
                        )}

                        {(fileError || (attemptedSubmit && !selectedFileName)) && (
                          <span className="text-red-500 text-xs mt-2 flex items-center">
                            <AlertCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                            {fileError || "Please select a file"}
                          </span>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter a title for your file" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {uploadStatus === 'uploading' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {uploadStatus === 'success' && (
                <div className="flex items-center text-green-600 text-xs md:text-sm">
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Upload complete!
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="flex items-center text-red-600 text-xs md:text-sm">
                  <AlertCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Upload failed. Please try again.
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline" 
                  size="sm"
                  className="text-xs md:text-sm"
                  onClick={() => setIsFileDialogOpen(false)}
                  disabled={uploadStatus === 'uploading'}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={uploadStatus === 'uploading' || uploadStatus === 'success'}
                  className="flex gap-1 text-xs md:text-sm"
                >
                  {uploadStatus === 'uploading' ? (
                    <>
                      <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : 'Upload'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
