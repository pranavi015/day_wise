import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface SM2Payload {
  user_id: string;
  topic_id: string;
  score: number; // 0-5
}

function computeSM2(
  score: number,
  easinessFactor: number,
  interval: number,
  repetitions: number
): { easinessFactor: number; interval: number; repetitions: number; nextReviewDate: string } {
  let newEF = easinessFactor;
  let newInterval = interval;
  let newReps = repetitions;

  if (score >= 3) {
    if (newReps === 0) newInterval = 1;
    else if (newReps === 1) newInterval = 6;
    else newInterval = Math.round(newInterval * newEF);
    newEF = newEF + 0.1 - (5 - score) * (0.08 + (5 - score) * 0.02);
    if (newEF < 1.3) newEF = 1.3;
    newReps += 1;
  } else {
    newReps = 0;
    newInterval = 1;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);
  const nextReviewDate = nextDate.toISOString().split("T")[0];

  return { easinessFactor: newEF, interval: newInterval, repetitions: newReps, nextReviewDate };
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, topic_id, score } = (await req.json()) as SM2Payload;

    if (!user_id || !topic_id || score === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch existing card or use defaults
    const { data: existing } = await supabaseAdmin
      .from("sr_cards")
      .select("*")
      .eq("user_id", user_id)
      .eq("topic_id", topic_id)
      .single();

    const ef = existing?.easiness_factor ?? 2.5;
    const interval = existing?.interval ?? 1;
    const repetitions = existing?.repetitions ?? 0;

    const result = computeSM2(score, ef, interval, repetitions);

    await supabaseAdmin.from("sr_cards").upsert({
      user_id,
      topic_id,
      easiness_factor: result.easinessFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      next_review_date: result.nextReviewDate,
    }, { onConflict: "user_id,topic_id" });

    return NextResponse.json({ ok: true, nextReviewDate: result.nextReviewDate });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
