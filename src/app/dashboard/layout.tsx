'use client';

import { useParams } from "next/navigation";
import { SideNav } from "./side-nav";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams();
  const joinOrg = useMutation(api.users.joinOrganization);
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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
    <main className="container mx-auto pt-4 md:pt-12 min-h-screen px-4 md:px-0">
      {/* Mobile sidebar toggle */}
      <div className="md:hidden mb-4">
        <Button 
          variant="outline" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-2"
        >
          <Menu className="h-5 w-5" />
          Menu
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar for mobile (modal/drawer style when open) */}
        <div className={`
          md:hidden fixed inset-0 z-50 bg-white transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <div className="p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Navigation</h2>
              <Button variant="ghost" onClick={() => setSidebarOpen(false)}>
                &times;
              </Button>
            </div>
            <SideNav onItemClick={() => setSidebarOpen(false)} />
          </div>
        </div>
        
        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 z-40 bg-black/20"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Desktop sidebar - always visible */}
        <div className="hidden md:block">
          <SideNav />
        </div>

        {/* Main content */}
        <div className="w-full">{children}</div>
      </div>
    </main>
  );
}
