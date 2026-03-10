import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Loader2, LogIn, Shield } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

/**
 * Compact inline sign-in button with an info tooltip.
 * Used in sidebars and tight spaces.
 */
export function SignInButton({
  className,
  variant = "default",
  size = "default",
  label = "Sign In",
}: {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
}) {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
        <Button
          variant={variant}
          size={size}
          onClick={login}
          disabled={isLoggingIn || isInitializing}
          data-ocid="auth.primary_button"
          className="gap-2"
        >
          {isLoggingIn ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <LogIn size={14} />
          )}
          {isLoggingIn ? "Connecting..." : label}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="auth.tooltip"
            >
              <Info size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="max-w-[220px] text-xs leading-relaxed"
            data-ocid="auth.tooltip"
          >
            <div className="flex gap-2">
              <Shield size={12} className="shrink-0 mt-0.5 text-primary" />
              <span>
                Internet Identity is a secure, passwordless login built into the
                Internet Computer. No email or password required.
              </span>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

/**
 * Full-width sidebar sign-in panel shown at the bottom of the sidebar.
 * Shows user info when logged in, sign-in prompt when logged out.
 */
export function SidebarAuthPanel() {
  const { identity, clear, isLoggingIn, isInitializing, login } =
    useInternetIdentity();

  const principal = identity?.getPrincipal().toString();
  const truncated = principal
    ? `${principal.slice(0, 6)}…${principal.slice(-4)}`
    : null;

  if (principal) {
    return (
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Shield size={13} className="text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-sidebar-foreground truncate">
              Signed in
            </div>
            <div className="text-xs text-muted-foreground truncate font-mono">
              {truncated}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
          className="w-full justify-start text-muted-foreground hover:text-foreground text-xs"
          data-ocid="auth.secondary_button"
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-sidebar-border">
      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
        Sign in to sync your portfolio securely.
      </p>
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            onClick={login}
            disabled={isLoggingIn || isInitializing}
            className="flex-1 gap-2 text-xs"
            data-ocid="auth.primary_button"
          >
            {isLoggingIn ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <LogIn size={13} />
            )}
            {isLoggingIn ? "Connecting..." : "Sign In"}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                data-ocid="auth.tooltip"
              >
                <Info size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="max-w-[220px] text-xs leading-relaxed"
            >
              <div className="flex gap-2">
                <Shield size={12} className="shrink-0 mt-0.5 text-primary" />
                <span>
                  Internet Identity is a secure, passwordless login built into
                  the Internet Computer. No email or password required.
                </span>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
