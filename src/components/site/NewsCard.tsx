import type { NewsPost } from "@/config/siteConfig";

export type { NewsPost };

export function NewsCard({ post }: { post: NewsPost }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_6px_24px_-14px_rgba(44,44,42,0.2)] ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(232,99,126,0.4)]">
      <div className="aspect-[16/10] overflow-hidden bg-primary-light">
        <img
          src={post.image}
          alt={post.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          {post.date}
        </span>
        <h3 className="mt-2 text-lg font-bold text-foreground">{post.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
        <button
          type="button"
          className="mt-4 self-start text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
        >
          Leer más →
        </button>
      </div>
    </article>
  );
}
