import type { RecommendedArticle } from "@/lib/pregnancy/today-engine";

export function WhatToKnowCards({ articles }: { articles: RecommendedArticle[] }) {
  return (
    <section>
      <h2 className="px-1 font-heading text-lg font-medium">What to know this week</h2>
      <div className="mt-3 flex flex-col gap-2.5">
        {articles.map((article) => (
          <div key={article.title} className="rounded-2xl border border-border bg-card px-4 py-3.5">
            <p className="text-[15px] font-medium text-foreground">{article.title}</p>
            <p className="mt-1 text-sm leading-snug text-muted-foreground">{article.blurb}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
