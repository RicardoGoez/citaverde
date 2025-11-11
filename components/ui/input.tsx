import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border-2 border-[#e2e8f0] bg-white px-4 py-2 text-sm text-[#0f172a] ring-offset-background transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-[#94a3b8]",
          "focus:border-[#26a69a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26a69a] focus-visible:ring-offset-2",
          "hover:border-[#cbd5e1]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f8fafc]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
