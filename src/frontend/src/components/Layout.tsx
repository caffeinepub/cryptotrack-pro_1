import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowLeftRight,
  Bot,
  LayoutDashboard,
  Menu,
  Moon,
  Sun,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Page } from "../App";
import { useTheme } from "../hooks/useTheme";
import { SidebarAuthPanel } from "./SignInPrompt";

const navItems: { path: Page; label: string; icon: React.ElementType }[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/trades", label: "Trades", icon: TrendingUp },
  { path: "/compare", label: "Compare", icon: ArrowLeftRight },
  { path: "/health", label: "Project Health", icon: Activity },
  { path: "/bot", label: "Bot", icon: Bot },
];

export default function Layout({
  children,
  currentPage,
  onNavigate,
}: {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (p: Page) => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLink = ({ path, label, icon: Icon }: (typeof navItems)[0]) => (
    <button
      type="button"
      onClick={() => {
        onNavigate(path);
        setMobileOpen(false);
      }}
      data-ocid={`nav.${label.toLowerCase().replace(" ", "_")}.link`}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left",
        currentPage === path
          ? "bg-sidebar-accent text-primary"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-sidebar border-r border-sidebar-border shrink-0">
        <div className="p-5 border-b border-sidebar-border">
          <h1 className="text-lg font-bold text-primary tracking-tight">
            CryptoTrack
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Portfolio Manager
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1" data-ocid="sidebar.panel">
          {navItems.map((item) => (
            <NavLink key={item.path} {...item} />
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-full justify-start gap-3 text-sidebar-foreground"
            data-ocid="theme.toggle"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
        </div>
        <SidebarAuthPanel />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: dismiss overlay
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <h1 className="text-lg font-bold text-primary">CryptoTrack</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </Button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.path} {...item} />
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-full justify-start gap-3"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
        </div>
        <SidebarAuthPanel />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            data-ocid="nav.menu.button"
          >
            <Menu size={20} />
          </Button>
          <h1 className="text-base font-bold text-primary">CryptoTrack</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-ocid="theme.toggle"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
