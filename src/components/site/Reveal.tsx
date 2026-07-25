import type { ReactNode, HTMLAttributes } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

type Props = HTMLAttributes<HTMLDivElement> & { children: ReactNode };

export function Reveal({ children, className, ...rest }: Props) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={cn("reveal", className)} {...rest}>
      {children}
    </div>
  );
}
