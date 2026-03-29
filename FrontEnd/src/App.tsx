import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "@/stores/useTheme";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Speak from "./pages/Speak";
import Chat from "./pages/Chat";
import Videos from "./pages/Videos";
import Profile from "./pages/Profile";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { Navigation } from "@/components/ui/Navigation";
import { Footer } from "@/components/ui/Footer";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: (
        <>
          <Navigation />
          <Index />
          <Footer />
        </>
      ),
    },
    {
      path: "/auth",
      element: (
        <>
          <Navigation />
          <Auth />
          <Footer />
        </>
      ),
    },
    {
      path: "/speak",
      element: (
        <>
          <Navigation />
          <Speak />
          <Footer />
        </>
      ),
    },
    {
      path: "/videos",
      element: (
        <>
          <Navigation />
          <Videos />
          <Footer />
        </>
      ),
    },
    {
      path: "/profile",
      element: (
        <>
          <Navigation />
          <Profile />
          <Footer />
        </>
      ),
    },
    {
      path: "/chat",
      element: (
        <ProtectedRoute>
          <Navigation />
          <Chat />
          <Footer />
        </ProtectedRoute>
      ),
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

const App = () => {
  const theme = useTheme((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>

      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider
          router={router}
          future={{
            v7_startTransition: true,
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
