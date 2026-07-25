import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function PlanLockedFeature({
  title,
  description,
  requiredPlan,
  children,
}: {
  title: string;
  description: string;
  requiredPlan: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border bg-muted/30 p-6">
      {children ? <div className="pointer-events-none blur-sm opacity-50">{children}</div> : null}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 p-6 text-center backdrop-blur-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        </div>
        <Button asChild size="sm">
          <Link to="/backoffice/plan">Actualizar a {requiredPlan}</Link>
        </Button>
      </div>
    </div>
  );
}
