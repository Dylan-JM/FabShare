import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const kv = Redis.fromEnv();

export async function POST(req: Request) {
  const body = await req.json() as { hash?: string; slug?: string };
  const { hash, slug: customSlug } = body;

  if (!hash) return NextResponse.json({ error: "Missing hash" }, { status: 400 });

  let slug = customSlug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 50);

  if (slug) {
    if (slug.length < 3) {
      return NextResponse.json({ error: "Name must be at least 3 characters" }, { status: 400 });
    }
    const existing = await kv.exists(`share:${slug}`);
    if (existing) {
      return NextResponse.json({ error: "That name is already taken" }, { status: 409 });
    }
  } else {
    slug = Math.random().toString(36).slice(2, 10);
  }

  await kv.set(`share:${slug}`, hash, { ex: 60 * 60 * 24 * 365 });
  return NextResponse.json({ slug });
}
