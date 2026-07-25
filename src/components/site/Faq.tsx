import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "./Reveal";
import { useSiteConfig } from "@/lib/tenant-context";

export function Faq() {
  const { faq } = useSiteConfig();
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-5 sm:px-6">
        <Reveal className="text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {faq.eyebrow}
          </p>
          <h2 className="font-rounded text-4xl sm:text-5xl">{faq.title}</h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">{faq.subtitle}</p>
        </Reveal>

        <Reveal className="mt-10">
          <Accordion type="single" collapsible className="w-full">
            {faq.items.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`item-${i}`}
                className="mb-3 rounded-2xl border border-border bg-white px-5 shadow-sm"
              >
                <AccordionTrigger className="py-5 text-left text-base font-semibold text-foreground hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-base leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
