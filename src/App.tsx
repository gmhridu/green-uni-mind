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

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <PersistGate loading={null} persistor={persistor} />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <NuqsAdapter>
          <ErrorBoundary>
            <RouterProvider router={router} />
          </ErrorBoundary>
        </NuqsAdapter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
