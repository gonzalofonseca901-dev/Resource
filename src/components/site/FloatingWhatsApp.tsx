import { useSiteConfig } from "@/lib/tenant-context";

export function FloatingWhatsApp() {
  const { business } = useSiteConfig();
  return (
    <a
      href={business.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatear por WhatsApp"
      className="wa-pulse fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform duration-300 hover:scale-105 sm:h-16 sm:w-16"
    >
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7 sm:h-8 sm:w-8"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M19.11 17.36c-.29-.15-1.7-.84-1.96-.93-.26-.1-.45-.14-.64.14-.19.29-.74.93-.9 1.12-.17.19-.33.21-.62.07-.29-.14-1.22-.45-2.32-1.43-.86-.77-1.44-1.71-1.61-2-.17-.29-.02-.44.13-.58.13-.13.29-.34.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49l-.55-.01c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.39s1.02 2.77 1.17 2.96c.14.19 2.02 3.09 4.9 4.33.68.29 1.22.47 1.63.6.68.22 1.31.19 1.8.11.55-.08 1.7-.7 1.94-1.37.24-.68.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34zM16 5C9.92 5 5 9.92 5 16c0 1.94.51 3.85 1.48 5.52L5 27l5.63-1.47A11 11 0 1027 16c0-6.08-4.92-11-11-11z" />
      </svg>
    </a>
  );
}
