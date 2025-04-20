'use client';

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@clerk/nextjs";

export function UserInitializer() {
  const ensureUserExists = useMutation(api.users.ensureUserExists);
  const { toast } = useToast();
  const { userId } = useAuth();

  useEffect(() => {
    // Only run ensureUserExists if there's an authenticated user
    if (userId) {
      ensureUserExists()
        .catch((error) => {
          console.error("Failed to ensure user exists:", error);
          toast({
            title: "Authentication error",
            description: "There was a problem with your account",
            variant: "destructive",
          });
        });
    }
  }, [ensureUserExists, toast, userId]);

  // This component doesn't render anything
  return null;
}