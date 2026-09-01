import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface ContentCategorySummary {
  key: string;
  label: string;
}

export interface ContentArticleSummary {
  slug: string;
  title: string;
  categoryKey: string | null;
  publishedAt: string | null;
}

export interface ContentArticleDetail extends ContentArticleSummary {
  body: string;
}

/** RLS restricts content_articles reads to status = 'published' for non-admins, so this list is always safe to render as-is. */
export async function listContentCategories(supabase: Supabase): Promise<ContentCategorySummary[]> {
  const { data } = await supabase.from("content_categories").select("key, label").order("sort_order", { ascending: true });
  return (data ?? []).map((row) => ({ key: row.key, label: row.label }));
}

async function categoryKeyById(supabase: Supabase): Promise<Map<string, string>> {
  const { data } = await supabase.from("content_categories").select("id, key");
  return new Map((data ?? []).map((row) => [row.id, row.key]));
}

export async function listPublishedArticles(supabase: Supabase, categoryKey?: string): Promise<ContentArticleSummary[]> {
  const [{ data }, categoryKeys] = await Promise.all([
    supabase
      .from("content_articles")
      .select("slug, title, category_id, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    categoryKeyById(supabase),
  ]);

  return (data ?? [])
    .map((row) => ({
      slug: row.slug,
      title: row.title,
      categoryKey: row.category_id ? (categoryKeys.get(row.category_id) ?? null) : null,
      publishedAt: row.published_at,
    }))
    .filter((row) => !categoryKey || row.categoryKey === categoryKey);
}

export async function getPublishedArticleBySlug(supabase: Supabase, slug: string): Promise<ContentArticleDetail | null> {
  const { data } = await supabase
    .from("content_articles")
    .select("slug, title, body, category_id, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) return null;

  const categoryKeys = data.category_id ? await categoryKeyById(supabase) : null;

  return {
    slug: data.slug,
    title: data.title,
    body: data.body,
    categoryKey: data.category_id ? (categoryKeys?.get(data.category_id) ?? null) : null,
    publishedAt: data.published_at,
  };
}
