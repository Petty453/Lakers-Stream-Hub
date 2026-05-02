import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import HomePage from "@/pages/home";
import SchedulePage from "@/pages/schedule";
import RosterPage from "@/pages/roster";
import NewsPage from "@/pages/news";
import InjuriesPage from "@/pages/injuries";
import StandingsPage from "@/pages/standings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 2,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/schedule" component={SchedulePage} />
        <Route path="/roster" component={RosterPage} />
        <Route path="/news" component={NewsPage} />
        <Route path="/injuries" component={InjuriesPage} />
        <Route path="/standings" component={StandingsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
