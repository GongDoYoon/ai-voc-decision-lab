import { goldenCases } from "@/data/golden-set";
import { sampleFeedback } from "@/data/sample-feedback";
import { evaluateGoldenSet } from "@/lib/voc-engine";

export async function GET() {
  return Response.json(evaluateGoldenSet(goldenCases, sampleFeedback));
}
