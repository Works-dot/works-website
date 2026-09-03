import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface ArrowLinkLabelProps {
  children: ReactNode;
  className?: string;
  size?: "small" | "default" | "large";
}

const sizeClasses = {
  small: "gap-2 text-sm [&_svg]:h-4 [&_svg]:w-4",
  default: "gap-2 [&_svg]:h-4 [&_svg]:w-4",
  large: "gap-2 text-lg [&_svg]:h-5 [&_svg]:w-5",
};

export function ArrowLinkLabel({
  children,
  className,
  size = "default",
}: ArrowLinkLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold text-works-primary",
        sizeClasses[size],
        className,
      )}
    >
      {children}
      <ArrowRight
        aria-hidden="true"
        className="shrink-0 transition-transform duration-300 group-hover:translate-x-1"
      />
    </span>
  );
}