// @/components/ui/card.tsx
import { cn } from "@/lib/utils";
import React from "react";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white dark:bg-inherit p-4 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-sm", className)} {...props}>
      {children}
    </div>
  );
}
