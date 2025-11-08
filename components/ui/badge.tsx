import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gradient-to-r from-[#26a69a] to-[#00796b] text-white shadow-sm",
        secondary: "border-transparent bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]",
        destructive: "border-transparent bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white shadow-sm",
        success: "border-transparent bg-gradient-to-r from-[#10b981] to-[#059669] text-white shadow-sm",
        warning: "border-transparent bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white shadow-sm",
        info: "border-transparent bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white shadow-sm",
        outline: "text-[#0f172a] border-[#e2e8f0] bg-white hover:bg-[#f8fafc]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
