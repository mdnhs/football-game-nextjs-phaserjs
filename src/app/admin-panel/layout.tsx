import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <div className="fixed inset-0 overflow-auto bg-background text-foreground">
        {children}
      </div>
      <Toaster richColors position="top-right" />
    </TooltipProvider>
  );
}
