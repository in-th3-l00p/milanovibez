import { NextResponse } from "next/server";
import { z } from "zod";

const PlaceZ = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  websiteUrl: z.string().url().optional(),
  googleMapsUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const PlanReqZ = z.object({
  places: z.array(PlaceZ).min(1),
  timeBudget: z.object({ unit: z.enum(["hours", "days"]), value: z.number().positive() }),
  start: z.string().datetime().optional(),
  preferences: z.array(z.string()).optional(),
});

const PlanRespZ = z.object({
  summary: z.string(),
  items: z.array(
    z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
      placeId: z.string().optional(),
      title: z.string(),
      details: z.string().optional(),
    }),
  ),
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = PlanReqZ.parse(body);

  const sys = `You are a meticulous Milan trip planner. Propose efficient, walkable itineraries prioritizing geography and user preferences. Always consider opening hours and travel time. Return valid JSON per the provided schema. Use the provided coordinates for distance ordering; avoid zig-zags.`;

  const user = {
    prompt: "Generate an itinerary as JSON PlanResponse",
    input: {
      timeBudget: parsed.timeBudget,
      start: parsed.start ?? null,
      preferences: parsed.preferences ?? [],
      places: parsed.places.map((p) => ({
        id: p.id,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        tags: p.tags ?? [],
      })),
    },
  };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5-reasoning",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: JSON.stringify(user) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "PlanResponse", schema: PlanRespZ.toJSON(), strict: true },
      },
      temperature: 0.2,
    }),
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    return NextResponse.json({ error: "openai_error", detail: t.slice(0, 2000) }, { status: 502 });
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  const parsedOut = PlanRespZ.parse(JSON.parse(content));
  return NextResponse.json(parsedOut);
}


