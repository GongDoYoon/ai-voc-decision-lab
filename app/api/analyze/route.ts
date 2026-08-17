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

  if (feedback.length > 200) {
    return Response.json(
      { error: "한 번에 최대 200건까지 분석할 수 있습니다." },
      { status: 400 },
    );
  }

  if (feedback.some((item) => !item.id || !item.text || item.text.length > 1000)) {
    return Response.json(
      { error: "VOC ID와 내용을 확인해주세요. 한 항목은 최대 1,000자입니다." },
      { status: 400 },
    );
  }

  const localAnalysis = analyzeFeedback(feedback);
  const personalApiKey = request.headers.get("x-openai-api-key")?.trim();
  const requestedModel = request.headers.get("x-openai-model")?.trim();
  const allowedModels = new Set(["gpt-5.4-nano", "gpt-5.4-mini", "gpt-5.4"]);
  const result = await enhanceAnalysisWithLlm(localAnalysis, feedback, {
    apiKey: personalApiKey || undefined,
    model: requestedModel && allowedModels.has(requestedModel)
      ? requestedModel
      : undefined,
  });
  return Response.json(result);
}
