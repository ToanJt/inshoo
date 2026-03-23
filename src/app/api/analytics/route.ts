// app/api/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/libs/supabase";

export type EventType =
  | "page_view"
  | "product_click"
  | "product_favorite"
  | "shopee_cta_click";

export interface TrackPayload {
  event: EventType;
  product_id?: string;
  product_title?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: TrackPayload = await req.json();

    const { error } = await supabaseAdmin.from("analytics_events").insert({
      event_type: body.event,
      product_id: body.product_id ?? null,
      product_title: body.product_title ?? null,
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Không để lỗi analytics crash app — trả về 200 nhưng log
    console.error("[analytics]", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
