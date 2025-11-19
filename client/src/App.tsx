import { useEffect } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Exercises from "./pages/Exercises";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import WorkoutSession from "./pages/WorkoutSession";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import { initializeDatabase } from "./lib/db";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/exercises"} component={Exercises} />
      <Route path={"/programs"} component={Programs} />
      <Route path={"/programs/:id"} component={ProgramDetail} />
      <Route path={"/workout/:id"} component={WorkoutSession} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
