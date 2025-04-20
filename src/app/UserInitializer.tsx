'use client';

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";

export function UserInitializer() {
  const ensureUserExists = useMutation(api.users.ensureUserExists);
  const { toast } = useToast();

  useEffect(() => {
    // Create the user if it doesn't exist
    ensureUserExists()
      .catch((error) => {
        console.error("Failed to ensure user exists:", error);
        toast({
          title: "Authentication error",
          description: "There was a problem with your account",
          variant: "destructive",
        });
      });
  }, [ensureUserExists, toast]);

  // This component doesn't render anything
  return null;
}