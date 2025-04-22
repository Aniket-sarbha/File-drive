"use client";

import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { FileIcon, StarIcon, TrashIcon, FolderIcon, HomeIcon, Database } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SideNav({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  const handleItemClick = () => {
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <div className="w-full md:w-48 flex flex-col gap-1 bg-gray-50 p-2 rounded-lg">
      <Link href="/dashboard/files" onClick={handleItemClick}>
        <Button
          variant={pathname.includes("/dashboard/files") ? "secondary" : "ghost"}
          className={clsx("flex gap-3 w-full justify-start h-10 mb-1", {
            "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800": pathname.includes("/dashboard/files"),
          })}
        >
          <FolderIcon className={clsx("h-4 w-4", {
            "text-blue-600": pathname.includes("/dashboard/files"),
          })} /> 
          <span className="font-medium">All Files</span>
        </Button>
      </Link>

      <Link href="/dashboard/favorites" onClick={handleItemClick}>
        <Button
          variant={pathname.includes("/dashboard/favorites") ? "secondary" : "ghost"}
          className={clsx("flex gap-3 w-full justify-start h-10 mb-1", {
            "bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800": pathname.includes("/dashboard/favorites"),
          })}
        >
          <StarIcon className={clsx("h-4 w-4", {
            "text-amber-500": pathname.includes("/dashboard/favorites"),
          })} /> 
          <span className="font-medium">Favorites</span>
        </Button>
      </Link>

      <Link href="/dashboard/trash" onClick={handleItemClick}>
        <Button
          variant={pathname.includes("/dashboard/trash") ? "secondary" : "ghost"}
          className={clsx("flex gap-3 w-full justify-start h-10", {
            "bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800": pathname.includes("/dashboard/trash"),
          })}
        >
          <TrashIcon className={clsx("h-4 w-4", {
            "text-red-500": pathname.includes("/dashboard/trash"),
          })} /> 
          <span className="font-medium">Trash</span>
        </Button>
      </Link>
    </div>
  );
}
