import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26a69a] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#26a69a] to-[#00796b] text-white shadow-md hover:shadow-lg hover:from-[#1e8e82] hover:to-[#005f50]",
        destructive: "bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white shadow-md hover:shadow-lg hover:from-[#dc2626] hover:to-[#b91c1c]",
        outline: "border-2 border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f8fafc] hover:border-[#26a69a]",
        secondary: "bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] hover:bg-[#dcfce7]",
        ghost: "hover:bg-[#f8fafc] hover:text-[#0f172a] text-[#64748b]",
        link: "text-[#26a69a] underline-offset-4 hover:underline",
        success: "bg-gradient-to-r from-[#10b981] to-[#059669] text-white shadow-md hover:shadow-lg hover:from-[#059669] hover:to-[#047857]",
        warning: "bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white shadow-md hover:shadow-lg hover:from-[#d97706] hover:to-[#b45309]",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
