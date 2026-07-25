import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Service } from "@/config/siteConfig";

export type { Service };

export function ServiceCard({ service }: { service: Service }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_6px_24px_-14px_rgba(44,44,42,0.25)] ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(232,99,126,0.45)]">
        <div className="aspect-[4/3] overflow-hidden bg-primary-light">
          <img
            src={service.image}
            alt={service.imageAlt}
            width={800}
            height={600}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h3 className="text-xl font-bold text-foreground">{service.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{service.short}</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
          >
            Conocer más
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </article>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg overflow-hidden p-0 [&>button]:hidden">
          <div className="aspect-[16/9] overflow-hidden bg-primary-light">
            <img
              src={service.image}
              alt={service.imageAlt}
              className="h-full w-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-foreground shadow hover:bg-white"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogHeader className="px-6 pb-6 pt-4 text-left">
            <DialogTitle className="font-display text-2xl">{service.title}</DialogTitle>
            <DialogDescription className="pt-2 text-base text-muted-foreground">
              {service.long}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
