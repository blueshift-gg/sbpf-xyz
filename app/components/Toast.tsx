"use client";

import { cn } from "@/lib/utils";
import { CrosshairCorners, Icon } from "@blueshift-gg/ui-components";
import { toast as sonnerToast } from "sonner";

type ToastVariant = "success" | "error" | "info";

interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
  className?: string;
}

const iconMap: Record<ToastVariant, string> = {
  success: "Check",
  error: "Cross",
  info: "Info",
};

export const Toast = ({
  title,
  description,
  variant = "info",
  className,
}: ToastProps) => {
  return (
    <div
      className={cn(
        "px-0 pb-4 pt-3 w-[calc(100dvw-32px)] xs:w-[300px] flex flex-col gap-y-2.5 bg-card-foreground gradient-border before:bg-card-border",
        variant === "success" && "text-state-success",
        variant === "error" && "text-state-error",
        variant === "info" && "text-shade-secondary",
        className
      )}
    >
      <div className="inset-0 absolute bg-linear-to-b from-current/8 via-transparent to-transparent"></div>
      <div className="px-3 py-2 bg-current/5 border border-current/15 flex items-center gap-x-2.5 relative">
        <CrosshairCorners
          animationDelay={0}
          animationDuration={0.5}
          variant="bordered"
          size={4}
          spacingX={1}
        />
        <Icon name={iconMap[variant]} className="shrink-0 text-current" size={16} />
        <span className="font-mono text-sm">{title}</span>
      </div>
      {description && (
        <p className="text-sm leading-[160%] font-medium text-shade-primary px-4">
          {description}
        </p>
      )}
    </div>
  );
};

// Helper function to show custom toasts
export const toast = {
  success: (title: string, description?: string) => {
    sonnerToast.custom(() => (
      <Toast title={title} description={description} variant="success" />
    ));
  },
  error: (title: string, description?: string) => {
    sonnerToast.custom(() => (
      <Toast title={title} description={description} variant="error" />
    ));
  },
  info: (title: string, description?: string) => {
    sonnerToast.custom(() => (
      <Toast title={title} description={description} variant="info" />
    ));
  },
  // Default toast (info variant)
  show: (title: string, description?: string) => {
    sonnerToast.custom(() => (
      <Toast title={title} description={description} variant="info" />
    ));
  },
};
