import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const kv = Redis.fromEnv();

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hash = await kv.get<string>(`share:${slug}`);
  if (!hash) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ hash });
}
