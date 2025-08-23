// frontend/src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { LoaderProvider } from "./contexts/LoaderContext";
import { LoaderOverlay } from "./LoaderOverlay";
import { Toaster as Sonner, Toaster } from "sonner";
import AnimatedRoutes from "./AnimateRoutes";
import "./index.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* AuthProvider removed from here — now provided in main.tsx */}
    <LoaderProvider>
      <LoaderOverlay />
      <Toaster />
      <Sonner />
      <AnimatedRoutes />
    </LoaderProvider>
  </QueryClientProvider>
);

export default App;
