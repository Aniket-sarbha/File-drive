"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "./dropdown-menu";
import { FiLogOut, FiUser } from "react-icons/fi";

export function CustomUserButton() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      // After signOut completes, manually redirect to home page
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const initials = `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
            <AvatarFallback>{initials || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-medium">{user.fullName || "User"}</p>
          <p className="text-xs text-gray-500">{user.primaryEmailAddress?.emailAddress}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => router.push("/user-profile")}
          className="cursor-pointer"
        >
          <FiUser className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="text-red-600 cursor-pointer"
        >
          <FiLogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}