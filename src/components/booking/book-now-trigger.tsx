import { useState } from "react";
import { useSiteConfig } from "@/lib/tenant-context";
import { BookingDialog } from "@/components/booking/booking-dialog";

export function BookNowTrigger({
  label,
  fallbackHref,
  className,
  onNavigate,
}: {
  label: string;
  fallbackHref: string;
  className: string;
  onNavigate?: () => void;
}) {
  const { business } = useSiteConfig();
  const [open, setOpen] = useState(false);

  // Si no hay un negocio real conectado (tenant 100% mock), se comporta
  // exactamente como antes: un link directo a WhatsApp u otro destino.
  if (!business.id) {
    const isExternal = fallbackHref.startsWith("http");
    return (
      <a
        href={fallbackHref}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        onClick={onNavigate}
        className={className}
      >
        {label}
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          onNavigate?.();
          setOpen(true);
        }}
      >
        {label}
      </button>
      <BookingDialog businessId={business.id} open={open} onOpenChange={setOpen} />
    </>
  );
}
