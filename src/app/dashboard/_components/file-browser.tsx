"use client";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { UploadButton } from "./upload-button";
import { FileCard } from "./file-card";
import Image from "next/image";
import { FilterIcon, GridIcon, Loader2, RowsIcon } from "lucide-react";
import { SearchBar } from "./search-bar";
import { useState } from "react";
import { DataTable } from "./file-table";
import { columns } from "./columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Doc } from "../../../../convex/_generated/dataModel";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function Placeholder() {
  return (
    <div className="flex flex-col gap-8 w-full items-center mt-12 md:mt-24">
      <Image
        alt="an image of a picture and directory icon"
        width="250"
        height="250"
        src="/empty.svg"
        className="w-48 md:w-64 lg:w-80"
      />
      <div className="text-xl md:text-2xl text-center px-4">You have no files, upload one now</div>
      <UploadButton />
    </div>
  );
}

export function FileBrowser({
  title,
  favoritesOnly,
  deletedOnly,
}: {
  title: string;
  favoritesOnly?: boolean;
  deletedOnly?: boolean;
}) {
  const organization = useOrganization();
  const user = useUser();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<Doc<"files">["type"] | "all">("all");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }

  const favorites = useQuery(
    api.files.getAllFavorites,
    orgId ? { orgId } : "skip"
  );

  const files = useQuery(
    api.files.getFiles,
    orgId
      ? {
          orgId,
          type: type === "all" ? undefined : type,
          query,
          favorites: favoritesOnly,
          deletedOnly,
        }
      : "skip"
  );
  const isLoading = files === undefined;

  const modifiedFiles =
    files?.map((file) => ({
      ...file,
      isFavorited: (favorites ?? []).some(
        (favorite) => favorite.fileId === file._id
      ),
      url: file.url, // Use the actual URL from the file object
    })) ?? [];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-4 w-full md:w-auto">
          <div className="w-full sm:w-auto">
            <SearchBar query={query} setQuery={setQuery} />
          </div>
          <UploadButton />
        </div>
      </div>

      <Tabs defaultValue="grid">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList className="mb-2">
            <TabsTrigger value="grid" className="flex gap-2 items-center">
              <GridIcon />
              <span className="hidden sm:inline">Grid</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="flex gap-2 items-center">
              <RowsIcon /> 
              <span className="hidden sm:inline">Table</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex w-full sm:w-auto flex-row items-center gap-2">
            {/* Mobile filter button */}
            <Button 
              variant="outline" 
              size="sm"
              className="sm:hidden"
              onClick={() => setFilterMenuOpen(!filterMenuOpen)}
            >
              <FilterIcon className="h-4 w-4 mr-2" />
              Filter
            </Button>

            {/* Desktop filter */}
            <div className="hidden sm:flex gap-2 items-center">
              <Label htmlFor="type-select">Type Filter</Label>
              <Select
                value={type}
                onValueChange={(newType) => {
                  setType(newType as any);
                }}
              >
                <SelectTrigger id="type-select" className="w-[120px] md:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Mobile filter dropdown */}
        {filterMenuOpen && (
          <div className="sm:hidden mb-4 p-4 border rounded-md bg-gray-50">
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="mobile-type-select">Type Filter</Label>
              <Select
                value={type}
                onValueChange={(newType) => {
                  setType(newType as any);
                  setFilterMenuOpen(false);
                }}
              >
                <SelectTrigger id="mobile-type-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col gap-8 w-full items-center mt-12 md:mt-24">
            <Loader2 className="h-24 w-24 md:h-32 md:w-32 animate-spin text-gray-500" />
            <div className="text-xl md:text-2xl">Loading your files...</div>
          </div>
        )}

        <TabsContent value="grid">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {modifiedFiles?.map((file) => {
              return <FileCard key={file._id} file={file} />;
            })}
          </div>
        </TabsContent>
        <TabsContent value="table">
          <div className="overflow-x-auto">
            <DataTable columns={columns} data={modifiedFiles} />
          </div>
        </TabsContent>
      </Tabs>

      {!isLoading && files?.length === 0 && <Placeholder />}
    </div>
  );
}
