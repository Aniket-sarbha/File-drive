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
import { FileTextIcon, GanttChartIcon, ImageIcon } from "lucide-react";
import { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Image from "next/image";
import { FileCardActions } from "./file-actions";

export function FileCard({
  file,
}: {
  file: Doc<"files"> & { isFavorited: boolean; url: string | null };
}) {
  const userProfile = useQuery(api.users.getUserProfile, {
    userId: file.userId,
  });

  const typeIcons = {
    image: <ImageIcon />,
    pdf: <FileTextIcon />,
    csv: <GanttChartIcon />,
  } as Record<Doc<"files">["type"], ReactNode>;

  return (
    <Card>
      <CardHeader className="relative p-4 md:p-6">
        <CardTitle className="flex gap-2 text-sm sm:text-base font-normal truncate pr-8">
          <div className="flex justify-center">{typeIcons[file.type]}</div>{" "}
          {file.name}
        </CardTitle>
        <div className="absolute top-2 right-2">
          <FileCardActions isFavorited={file.isFavorited} file={file} />
        </div>
      </CardHeader>
      <CardContent className="h-[150px] sm:h-[180px] md:h-[200px] flex justify-center items-center p-4">
        {file.type === "image" && file.url && (
          <Image 
            alt={file.name} 
            width="200" 
            height="100" 
            src={file.url}
            className="max-h-full max-w-full object-contain"
          />
        )}

        {file.type === "csv" && <GanttChartIcon className="w-16 h-16 md:w-20 md:h-20" />}
        {file.type === "pdf" && <FileTextIcon className="w-16 h-16 md:w-20 md:h-20" />}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 px-4 py-3 md:px-6 md:py-4">
        <div className="flex gap-2 text-xs text-gray-700 items-center truncate">
          <Avatar className="w-5 h-5 md:w-6 md:h-6">
            <AvatarImage src={userProfile?.image} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <span className="truncate">{userProfile?.name}</span>
        </div>
        <div className="text-xs text-gray-700 truncate">
          {formatRelative(new Date(file._creationTime), new Date())}
        </div>
      </CardFooter>
    </Card>
  );
}
