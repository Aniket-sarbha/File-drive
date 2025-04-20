'use client';

import { useParams } from "next/navigation";
import { SideNav } from "./side-nav";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams();
  const joinOrg = useMutation(api.users.joinOrganization);
  const { toast } = useToast();
  
  // Extract the orgId from URL params
  // In Next.js dynamic routes, the parameter might be nested
  const orgId = typeof params.orgId === 'string' 
    ? params.orgId 
    : Array.isArray(params.orgId) 
      ? params.orgId[0]
      : null;

  useEffect(() => {
    if (orgId) {
      console.log("Attempting to join organization:", orgId);
      
      // Join the organization when the dashboard loads
      joinOrg({ orgId })
        .then((result) => {
          console.log("Join organization result:", result);
        })
        .catch((error) => {
          console.error("Failed to join organization:", error);
          toast({
            title: "Organization error",
            description: "Failed to join this organization",
            variant: "destructive",
          });
        });
    } else {
      console.log("No organization ID found in URL params:", params);
    }
  }, [joinOrg, orgId, params, toast]);

  return (
    <main className="container mx-auto pt-12 min-h-screen">
      <div className="flex gap-8">
        <SideNav />

        <div className="w-full">{children}</div>
      </div>
    </main>
  );
}
