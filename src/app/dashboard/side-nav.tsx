"use client";

import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { FileIcon, StarIcon, TrashIcon } from "lucide-react";
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
    <div className="w-full md:w-40 flex flex-col gap-4">
      <Link href="/dashboard/files" onClick={handleItemClick}>
        <Button
          variant={"link"}
          className={clsx("flex gap-2 w-full justify-start", {
            "text-blue-500": pathname.includes("/dashboard/files"),
          })}
        >
          <FileIcon /> All Files
        </Button>
      </Link>

      <Link href="/dashboard/favorites" onClick={handleItemClick}>
        <Button
          variant={"link"}
          className={clsx("flex gap-2 w-full justify-start", {
            "text-blue-500": pathname.includes("/dashboard/favorites"),
          })}
        >
          <StarIcon /> Favorites
        </Button>
      </Link>

      <Link href="/dashboard/trash" onClick={handleItemClick}>
        <Button
          variant={"link"}
          className={clsx("flex gap-2 w-full justify-start", {
            "text-blue-500": pathname.includes("/dashboard/trash"),
          })}
        >
          <TrashIcon /> Trash
        </Button>
      </Link>
    </div>
  );
}
