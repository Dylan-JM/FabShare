import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const kv = Redis.fromEnv();

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hash = await kv.get<string>(`share:${slug}`);
  if (!hash) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ hash });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { hash } = await req.json() as { hash: string };
  if (!hash) return NextResponse.json({ error: "Missing hash" }, { status: 400 });
  const exists = await kv.exists(`share:${slug}`);
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await kv.set(`share:${slug}`, hash, { ex: 60 * 60 * 24 * 365 });
  return NextResponse.json({ ok: true });
}
