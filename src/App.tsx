import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import router from "./routes/router";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./redux/store";
import { NuqsAdapter } from "nuqs/adapters/react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { initializeSecurity } from "@/config/security";
import { useEffect } from "react";

const queryClient = new QueryClient();

function App() {
  // Initialize security measures on app startup
  useEffect(() => {
    initializeSecurity();
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <NuqsAdapter>
                <RouterProvider
                  router={router}
                  future={{
                    v7_startTransition: true,
                  }}
                />
                <Toaster />
                <Sonner />
              </NuqsAdapter>
            </TooltipProvider>
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}



export default App;
