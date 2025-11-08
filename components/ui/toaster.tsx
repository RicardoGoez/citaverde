"use client";

import { Toast } from "@/components/ui/toast";
import { useToasts } from "@/lib/hooks/use-toast";
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  default: null,
};

export function Toaster() {
  const { toasts, dismiss } = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 md:max-w-[420px]">
      {toasts.map((toast) => {
        const Icon = icons[toast.variant] || null;
        
        return (
          <Toast
            key={toast.id}
            variant={toast.variant}
            onClose={() => dismiss(toast.id)}
          >
            <div className="flex gap-3">
              {Icon && (
                <div className="mt-0.5 flex-shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                {toast.title && (
                  <div className="font-semibold text-sm">{toast.title}</div>
                )}
                {toast.description && (
                  <div className="text-sm opacity-90">{toast.description}</div>
                )}
              </div>
            </div>
          </Toast>
        );
      })}
    </div>
  );
}
