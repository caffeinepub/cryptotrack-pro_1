import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowLeftRight,
  BarChart2,
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
  { path: "/markets", label: "Markets", icon: BarChart2 },
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

  const NavLink = ({ path, label, icon: Icon }: (typeof navItems)[0]) => {
    const isActive = currentPage === path;
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate(path);
          setMobileOpen(false);
        }}
        data-ocid={`nav.${label.toLowerCase().replace(" ", "_")}.link`}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all text-left relative",
          isActive
            ? "text-primary neon-text-primary"
            : "text-sidebar-foreground hover:text-primary hover:neon-text-primary",
        )}
        style={
          isActive
            ? {
                borderLeft: "2px solid oklch(0.72 0.3 340 / 0.9)",
                paddingLeft: "10px",
                background: "oklch(0.72 0.3 340 / 0.06)",
              }
            : { borderLeft: "2px solid transparent", paddingLeft: "10px" }
        }
      >
        <Icon size={15} />
        <span className="uppercase tracking-wider text-xs">{label}</span>
      </button>
    );
  };

  return (
    <div className="scanline flex h-screen bg-background overflow-hidden">
      {/* Sidebar - desktop */}
      <aside
        className="hidden md:flex flex-col w-56 bg-sidebar shrink-0"
        style={{
          borderRight: "1px solid oklch(0.72 0.3 340 / 0.25)",
          boxShadow: "2px 0 16px oklch(0.72 0.3 340 / 0.08)",
        }}
      >
        <div
          className="p-5"
          style={{ borderBottom: "1px solid oklch(0.72 0.3 340 / 0.2)" }}
        >
          <h1 className="text-lg font-bold text-primary neon-text-primary tracking-widest uppercase">
            Genesis
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 tracking-wider uppercase opacity-60">
            Trading Bot
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5" data-ocid="sidebar.panel">
          {navItems.map((item) => (
            <NavLink key={item.path} {...item} />
          ))}
        </nav>
        <div
          className="p-3"
          style={{ borderTop: "1px solid oklch(0.72 0.3 340 / 0.2)" }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-full justify-start gap-3 text-muted-foreground text-xs uppercase tracking-wider"
            data-ocid="theme.toggle"
          >
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            {theme === "dark" ? "Light" : "Dark"}
          </Button>
        </div>
        <SidebarAuthPanel />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: dismiss overlay
        <div
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ borderRight: "1px solid oklch(0.72 0.3 340 / 0.3)" }}
      >
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: "1px solid oklch(0.72 0.3 340 / 0.2)" }}
        >
          <h1 className="text-lg font-bold text-primary neon-text-primary tracking-widest uppercase">
            Genesis
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </Button>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.path} {...item} />
          ))}
        </nav>
        <div
          className="p-3"
          style={{ borderTop: "1px solid oklch(0.72 0.3 340 / 0.2)" }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-full justify-start gap-3 text-xs uppercase tracking-wider text-muted-foreground"
          >
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            {theme === "dark" ? "Light" : "Dark"}
          </Button>
        </div>
        <SidebarAuthPanel />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header
          className="md:hidden flex items-center justify-between p-4 bg-sidebar"
          style={{ borderBottom: "1px solid oklch(0.72 0.3 340 / 0.25)" }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            data-ocid="nav.menu.button"
          >
            <Menu size={20} />
          </Button>
          <h1 className="text-base font-bold text-primary neon-text-primary tracking-widest uppercase">
            Genesis
          </h1>
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
