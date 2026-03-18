import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import ProjectGallery from "./pages/ProjectGallery";
import Workspace from "./pages/Workspace";
import NotFound from "./pages/NotFound";
import MobileSync from "./pages/MobileSync";

// Demo Mode — locks the app into a safe, non-destructive demo experience
export const DEMO_MODE = true;

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProjectGallery />} />
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/mobile" element={<MobileSync />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;