import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import Bot from "./pages/Bot";
import Compare from "./pages/Compare";
import Dashboard from "./pages/Dashboard";
import Health from "./pages/Health";
import Trades from "./pages/Trades";

export type Page = "/" | "/trades" | "/compare" | "/health" | "/bot";

export default function App() {
  const [page, setPage] = useState<Page>(() => {
    const hash = window.location.hash.replace("#", "") as Page;
    return (
      ["/trades", "/compare", "/health", "/bot"].includes(hash) ? hash : "/"
    ) as Page;
  });

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "") as Page;
      setPage(
        ["/trades", "/compare", "/health", "/bot"].includes(hash) ? hash : "/",
      );
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (p: Page) => {
    window.location.hash = p;
    setPage(p);
  };

  const renderPage = () => {
    switch (page) {
      case "/trades":
        return <Trades />;
      case "/compare":
        return <Compare />;
      case "/health":
        return <Health />;
      case "/bot":
        return <Bot />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Layout currentPage={page} onNavigate={navigate}>
        {renderPage()}
      </Layout>
      <Toaster />
    </>
  );
}
