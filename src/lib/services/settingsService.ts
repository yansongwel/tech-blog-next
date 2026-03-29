import { prisma } from "@/lib/prisma";

const ALLOWED_KEYS = new Set([
  "site_name", "site_logo", "site_description", "site_subtitle",
  "author_name", "author_bio", "author_avatar", "author_skills",
  "github_url", "email", "icp_number", "wechat_qr_url",
  "music_url", "site_start_date", "theme_name",
  "loading_template", "loading_auto_enter", "loading_duration",
  "mouse_skin", "dancing_character",
]);

export async function getAllSettings(): Promise<Record<string, string>> {
  const configs = await prisma.siteConfig.findMany();
  const settings: Record<string, string> = {};
  for (const c of configs) {
    settings[c.key] = c.value;
  }
  return settings;
}

export async function updateSettings(body: Record<string, unknown>): Promise<void> {
  const entries = Object.entries(body).filter(([key]) => ALLOWED_KEYS.has(key));

  // Batch upsert in a transaction instead of sequential awaits
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteConfig.upsert({
        where: { key },
        update: { value: String(value ?? "") },
        create: { key, value: String(value ?? "") },
      })
    )
  );
}
