export type BlogFrontmatter = {
  title: string;
  date: string; // ISO-ish YYYY-MM-DD
  category: string;
  tags: string[];
  excerpt: string;
  coverImage: string; // public path
  featured?: boolean;
  author?: string;
};

export type BlogPost = {
  slug: string;
  frontmatter: BlogFrontmatter;
  body: string;
  readingMinutes: number;
};
