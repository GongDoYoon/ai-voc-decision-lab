import { sampleFeedback } from "@/data/sample-feedback";
import { enhanceAnalysisWithLlm } from "@/lib/llm-provider";
import { analyzeFeedback, type Feedback } from "@/lib/voc-engine";

export async function POST(request: Request) {
  let feedback: Feedback[] = sampleFeedback;

  try {
    const body = (await request.json()) as { feedback?: Feedback[] };
    if (Array.isArray(body.feedback) && body.feedback.length > 0) {
      feedback = body.feedback;
    }
  } catch {
    // Empty bodies intentionally use the safe demo dataset.
  }

  if (feedback.length > 500) {
    return Response.json(
      { error: "한 번에 최대 500건까지 분석할 수 있습니다." },
      { status: 400 },
    );
  }

  const localAnalysis = analyzeFeedback(feedback);
  const result = await enhanceAnalysisWithLlm(localAnalysis, feedback);
  return Response.json(result);
}
