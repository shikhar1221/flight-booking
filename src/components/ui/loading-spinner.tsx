import { cn } from "@/lib/utils";
import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  text?: string;
  centered?: boolean;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12"
};

export function LoadingSpinner({ 
  size = "md", 
  text, 
  centered = false,
  className,
  ...props 
}: LoadingSpinnerProps) {
  const containerClasses = cn(
    "flex flex-col items-center",
    centered && "justify-center min-h-[200px]",
    className
  );

  return (
    <div className={containerClasses} {...props}>
      <Loader2 className={cn(
        "animate-spin text-primary",
        sizeClasses[size]
      )} />
      {text && (
        <p className="mt-4 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
}