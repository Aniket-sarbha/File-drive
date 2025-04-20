"use client";

import { Button } from "@/components/ui/button";
import {
  OrganizationSwitcher,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useSession,
} from "@clerk/nextjs";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative z-10 border-b py-4 bg-gray-50">
      <div className="items-center container mx-auto justify-between flex flex-wrap px-4 md:px-0">
        <Link href="/" className="flex gap-2 items-center text-xl text-black">
          <Image src="/logo.png" width="50" height="50" alt="file drive logo" />
          FileDrive
        </Link>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:flex md:items-center md:gap-4">
          <SignedIn>
            <Button variant={"outline"}>
              <Link href="/dashboard/files">Your Files</Link>
            </Button>
          </SignedIn>

          <div className="flex gap-2">
            <OrganizationSwitcher />
            <UserButton />
            <SignedOut>
              <SignInButton>
                <Button>Sign In</Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="w-full mt-4 flex flex-col gap-4 md:hidden">
            <SignedIn>
              <Button variant={"outline"} className="w-full">
                <Link href="/dashboard/files" className="w-full">Your Files</Link>
              </Button>
            </SignedIn>

            <div className="flex flex-col gap-2 w-full">
              <div className="flex justify-between items-center">
                <OrganizationSwitcher />
                <UserButton />
              </div>
              <SignedOut>
                <SignInButton>
                  <Button className="w-full">Sign In</Button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
