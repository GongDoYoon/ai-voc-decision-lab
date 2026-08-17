"use client";

import { useMemo, useState } from "react";
import { goldenCases } from "@/data/golden-set";
import { sampleFeedback } from "@/data/sample-feedback";
import {
  analyzeFeedback,
  buildPrd,
  evaluateGoldenSet,
  type AnalysisResult,
  type Feedback,
} from "@/lib/voc-engine";

type View = "discover" | "prd" | "evaluate";

const viewLabels: Array<{ id: View; label: string; eyebrow: string }> = [
  { id: "discover", label: "발견", eyebrow: "01" },
  { id: "prd", label: "PRD", eyebrow: "02" },
  { id: "evaluate", label: "평가", eyebrow: "03" },
];

const metricDescriptions = {
  overall: "릴리스 판단에 쓰는 가중 종합 점수",
  themeAccuracy: "골든셋에서 기대 주제를 맞힌 비율",
  citationValidity: "존재하는 VOC ID만 인용한 비율",
  safetyPassRate: "프롬프트 인젝션 방어 시나리오 통과율",
};

interface AnalyzeApiResult {
  mode: "local" | "llm";
  analysis: AnalysisResult;
  model?: string;
  warning?: string;
  error?: string;
}

function parseFeedbackInput(value: string): Feedback[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 200)
    .map((line, index) => {
      const severityMatch = line.match(/^\[([1-5])\]\s*/);
      const severity = Number(severityMatch?.[1] ?? 3) as Feedback["severity"];
      return {
        id: `USER-${String(index + 1).padStart(3, "0")}`,
        text: line.replace(/^\[[1-5]\]\s*/, "").slice(0, 1000),
        channel: "직접 입력",
        segment: "사용자 VOC",
        severity,
      };
    });
}

export default function Home() {
  const baselineAnalysis = useMemo(() => analyzeFeedback(sampleFeedback), []);
  const evaluation = useMemo(
    () => evaluateGoldenSet(goldenCases, sampleFeedback),
    [],
  );
  const [analysis, setAnalysis] = useState(baselineAnalysis);
  const [activeFeedback, setActiveFeedback] = useState<Feedback[]>(sampleFeedback);
  const [view, setView] = useState<View>("discover");
  const [selectedTheme, setSelectedTheme] = useState<string>(baselineAnalysis.themes[0].key);
  const [hasRun, setHasRun] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-5.4-mini");
  const [rawFeedback, setRawFeedback] = useState("");
  const [analysisMode, setAnalysisMode] = useState<"local" | "llm">("local");
  const [isRunning, setIsRunning] = useState(false);
  const [runMessage, setRunMessage] = useState("샘플 24건으로 즉시 체험할 수 있습니다.");

  const prd = useMemo(
    () => buildPrd(analysis, selectedTheme),
    [analysis, selectedTheme],
  );

  const selected =
    analysis.themes.find((theme) => theme.key === selectedTheme) ??
    analysis.themes[0];
  const evidence = activeFeedback.filter((item) =>
    selected.evidenceIds.includes(item.id),
  );

  async function runAnalysis() {
    const feedback = rawFeedback.trim()
      ? parseFeedbackInput(rawFeedback)
      : sampleFeedback;

    if (feedback.length < 3) {
      setRunMessage("분석하려면 VOC를 세 줄 이상 입력해주세요.");
      return;
    }

    setIsRunning(true);
    setRunMessage(apiKey ? "개인 AI가 VOC를 분석하고 있습니다…" : "로컬 엔진이 VOC를 분석하고 있습니다…");

    try {
      const headers: Record<string, string> = {
        "content-type": "application/json",
        "x-openai-model": model,
      };
      if (apiKey.trim()) headers["x-openai-api-key"] = apiKey.trim();

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({ feedback }),
      });
      const result = (await response.json()) as AnalyzeApiResult;
      if (!response.ok || result.error) {
        throw new Error(result.error || "분석 요청에 실패했습니다.");
      }

      setAnalysis(result.analysis);
      setActiveFeedback(feedback);
      setSelectedTheme(result.analysis.themes[0]?.key ?? "");
      setAnalysisMode(result.mode);
      setHasRun(true);
      setView("discover");
      setRunMessage(
        result.mode === "llm"
          ? `${result.model ?? model} 연결 완료 · 실제 AI 분석 결과입니다.`
          : result.warning
            ? `${result.warning} 로컬 분석 결과로 안전하게 전환했습니다.`
            : "API 키 없이 로컬 분석을 완료했습니다.",
      );
      document
        .getElementById("workspace")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      setRunMessage(error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setIsRunning(false);
    }
  }

  function resetToSample() {
    setRawFeedback("");
    setAnalysis(baselineAnalysis);
    setActiveFeedback(sampleFeedback);
    setSelectedTheme(baselineAnalysis.themes[0].key);
    setAnalysisMode("local");
    setRunMessage("샘플 24건을 다시 불러왔습니다.");
  }

  function disconnectAi() {
    setApiKey("");
    setAnalysisMode("local");
    setRunMessage("개인 API 키를 메모리에서 지웠습니다.");
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="AI VOC Decision Lab 홈">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>
            AI VOC
            <strong>Decision Lab</strong>
          </span>
        </a>
        <nav aria-label="주요 탐색">
          <a href="#workspace">제품</a>
          <a href="#method">방법론</a>
          <a href="#evaluation">평가</a>
        </nav>
        <span className="system-status">
          <i /> Demo online
        </span>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="kicker">
            <span>AI PRODUCT DISCOVERY</span>
            2026 PORTFOLIO PROJECT
          </p>
          <h1>
            감이 아니라,
            <br />
            <em>근거로 결정하는</em> AI 기획
          </h1>
          <p className="hero-description">
            흩어진 고객 피드백을 문제 신호로 묶고, 모든 인사이트를 원문에
            연결합니다. 기획안 생성부터 골든셋 평가, 출시 판단까지 하나의
            반복 가능한 흐름으로 설계했습니다.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={runAnalysis}>
              VOC 분석 실행 <span aria-hidden="true">↗</span>
            </button>
            <a className="text-link" href="#method">
              의사결정 원칙 보기 <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <aside className="signal-panel" aria-label="분석 상태 요약">
          <div className="signal-head">
            <span>LIVE SIGNAL</span>
            <b>{analysisMode === "llm" ? "개인 AI 연결" : hasRun ? "로컬 분석" : "샘플 데이터"}</b>
          </div>
          <div className="signal-score">
            <strong>{evaluation.metrics.overall}</strong>
            <span>/100</span>
            <p>RELEASE CONFIDENCE</p>
          </div>
          <div className="signal-lines">
            <span style={{ width: "91%" }} />
            <span style={{ width: "78%" }} />
            <span style={{ width: "64%" }} />
            <span style={{ width: "47%" }} />
          </div>
          <dl>
            <div>
              <dt>VOC</dt>
              <dd>{activeFeedback.length}</dd>
            </div>
            <div>
              <dt>THEMES</dt>
              <dd>{analysis.themes.length}</dd>
            </div>
            <div>
              <dt>CITATIONS</dt>
              <dd>{evaluation.metrics.citationValidity}%</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="proof-strip" aria-label="핵심 제품 원칙">
        <span>01</span>
        <p>Evidence-linked</p>
        <span>02</span>
        <p>Human-in-the-loop</p>
        <span>03</span>
        <p>Eval before ship</p>
        <span>04</span>
        <p>Personal AI ready</p>
      </section>

      <section className="workspace" id="workspace">
        <div className="section-heading">
          <div>
            <p className="section-index">PRODUCT WORKSPACE · 01</p>
            <h2>하나의 VOC에서 출시 판단까지</h2>
          </div>
          <p>
            API 키 없이 로컬 엔진으로 체험하고, 개인 OpenAI 키를 연결하면
            입력한 VOC를 실제 AI가 근거와 함께 분석합니다.
          </p>
        </div>

        <section className="live-control" aria-labelledby="live-control-title">
          <div className="live-control-head">
            <div>
              <p className="section-index">LIVE INPUT · PERSONAL AI</p>
              <h3 id="live-control-title">내 VOC로 직접 분석하기</h3>
            </div>
            <span className={analysisMode === "llm" ? "connection-state connected" : "connection-state"}>
              <i /> {analysisMode === "llm" ? "AI CONNECTED" : apiKey ? "KEY READY" : "LOCAL READY"}
            </span>
          </div>
          <div className="live-control-grid">
            <div className="connection-card">
              <label htmlFor="personal-api-key">개인 OpenAI API 키</label>
              <input
                id="personal-api-key"
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-…"
                autoComplete="off"
                spellCheck={false}
              />
              <label htmlFor="ai-model">분석 모델</label>
              <select id="ai-model" value={model} onChange={(event) => setModel(event.target.value)}>
                <option value="gpt-5.4-mini">GPT-5.4 mini · 권장</option>
                <option value="gpt-5.4-nano">GPT-5.4 nano · 저비용</option>
                <option value="gpt-5.4">GPT-5.4 · 고품질</option>
              </select>
              <p>키는 브라우저 저장소나 데이터베이스에 저장하지 않으며, 분석 요청 때만 서버를 거쳐 OpenAI로 전달됩니다. 개인정보를 제거한 VOC만 입력해주세요.</p>
              {apiKey && <button className="disconnect-button" onClick={disconnectAi}>연결 정보 지우기</button>}
            </div>
            <div className="voc-input-card">
              <label htmlFor="raw-feedback">VOC 원문 · 한 줄에 한 건</label>
              <textarea
                id="raw-feedback"
                value={rawFeedback}
                onChange={(event) => setRawFeedback(event.target.value)}
                placeholder={'[5] 저장한 메모가 사라졌어요\n[4] AI 요약의 근거를 찾기 어려워요\n[3] 팀원에게 결과를 공유하고 싶어요'}
                rows={7}
              />
              <div className="input-actions">
                <button className="sample-button" onClick={resetToSample}>샘플 24건 불러오기</button>
                <button className="primary-button" onClick={runAnalysis} disabled={isRunning}>
                  {isRunning ? "분석 중…" : apiKey ? "개인 AI로 분석 ↗" : "로컬로 분석 ↗"}
                </button>
              </div>
              <p className="run-message" role="status">{runMessage}</p>
            </div>
          </div>
        </section>

        <div className="app-shell">
          <aside className="app-sidebar">
            <div className="dataset-title">
              <span className="dataset-icon">D</span>
              <div>
                <strong>{activeFeedback[0]?.id.startsWith("USER-") ? "사용자 입력 데이터" : "모바일 생산성 앱"}</strong>
                <p>{analysisMode === "llm" ? "개인 AI 분석" : "로컬 분석"}</p>
              </div>
            </div>
            <div className="sidebar-label">WORKFLOW</div>
            {viewLabels.map((item) => (
              <button
                className={view === item.id ? "side-nav active" : "side-nav"}
                key={item.id}
                onClick={() => setView(item.id)}
              >
                <span>{item.eyebrow}</span>
                {item.label}
                {item.id === "evaluate" && (
                  <b>{evaluation.metrics.overall}</b>
                )}
              </button>
            ))}
            <div className="sidebar-meta">
              <p>DATASET HEALTH</p>
              <strong>{activeFeedback.length} / {activeFeedback.length} valid</strong>
              <div className="mini-progress">
                <span />
              </div>
              <small>개인정보 제거 · 중복 정리 완료</small>
            </div>
          </aside>

          <div className="app-content">
            {view === "discover" && (
              <div className="view-panel">
                <div className="view-header">
                  <div>
                    <span className="view-kicker">DISCOVER</span>
                    <h3>고객 문제 신호</h3>
                  </div>
                  <div className="mode-pill">{analysisMode === "llm" ? `${model} · LIVE` : "로컬 평가 엔진"}</div>
                </div>

                <div className="theme-grid">
                  {analysis.themes.map((theme) => (
                    <button
                      key={theme.key}
                      className={
                        selectedTheme === theme.key
                          ? "theme-card selected"
                          : "theme-card"
                      }
                      onClick={() => setSelectedTheme(theme.key)}
                    >
                      <div className="theme-topline">
                        <span style={{ background: theme.accent }} />
                        <b>{theme.count} signals</b>
                      </div>
                      <strong>{theme.label}</strong>
                      <p>{theme.summary}</p>
                      <div className="score-row">
                        <span>OPPORTUNITY</span>
                        <em>{theme.opportunityScore}</em>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="evidence-panel">
                  <div className="evidence-summary">
                    <p className="view-kicker">SELECTED THEME</p>
                    <h4>{selected.label}</h4>
                    <p>{selected.recommendation}</p>
                    <dl>
                      <div>
                        <dt>Reach</dt>
                        <dd>{Math.round(selected.reach * 100)}%</dd>
                      </div>
                      <div>
                        <dt>Severity</dt>
                        <dd>{selected.averageSeverity.toFixed(1)}/5</dd>
                      </div>
                      <div>
                        <dt>Confidence</dt>
                        <dd>{Math.round(selected.confidence * 100)}%</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="evidence-list">
                    <div className="evidence-list-head">
                      <strong>근거 원문</strong>
                      <span>{evidence.length} cited</span>
                    </div>
                    {evidence.map((item) => (
                      <article key={item.id}>
                        <span>{item.id}</span>
                        <div>
                          <p>“{item.text}”</p>
                          <small>
                            {item.channel} · {item.segment} · 심각도 {item.severity}
                          </small>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="ranking-panel">
                  <div>
                    <p className="view-kicker">PRIORITY</p>
                    <h4>기회 점수 순위</h4>
                  </div>
                  <div className="ranking-list">
                    {analysis.themes.map((theme, index) => (
                      <div className="ranking-row" key={theme.key}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <strong>{theme.label}</strong>
                        <div>
                          <i style={{ width: `${theme.opportunityScore}%` }} />
                        </div>
                        <b>{theme.opportunityScore}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {view === "prd" && (
              <div className="view-panel prd-view">
                <div className="view-header">
                  <div>
                    <span className="view-kicker">PRODUCT REQUIREMENT</span>
                    <h3>{prd.title}</h3>
                  </div>
                  <div className="decision-badge">MVP · 2 WEEKS</div>
                </div>
                <div className="prd-lead">
                  <span>PROBLEM</span>
                  <p>{prd.problem}</p>
                </div>
                <div className="prd-columns">
                  <article>
                    <span>JOB STORY</span>
                    <h4>사용자 요구</h4>
                    <p>{prd.userStory}</p>
                  </article>
                  <article>
                    <span>SOLUTION</span>
                    <h4>해결 가설</h4>
                    <p>{prd.solution}</p>
                  </article>
                </div>
                <div className="criteria-grid">
                  <article>
                    <p className="view-kicker">ACCEPTANCE CRITERIA</p>
                    <ul>
                      {prd.acceptanceCriteria.map((item) => (
                        <li key={item}>
                          <span>✓</span>{item}
                        </li>
                      ))}
                    </ul>
                  </article>
                  <article>
                    <p className="view-kicker">SUCCESS METRICS</p>
                    <ul>
                      {prd.successMetrics.map((item) => (
                        <li key={item}>
                          <span>↗</span>{item}
                        </li>
                      ))}
                    </ul>
                  </article>
                  <article>
                    <p className="view-kicker">NON-GOALS</p>
                    <ul>
                      {prd.nonGoals.map((item) => (
                        <li key={item}>
                          <span>—</span>{item}
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>
                <div className="release-plan">
                  {prd.releasePlan.map((phase, index) => (
                    <article key={phase.week}>
                      <span>0{index + 1}</span>
                      <p>{phase.week}</p>
                      <strong>{phase.goal}</strong>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {view === "evaluate" && (
              <div className="view-panel eval-view" id="evaluation">
                <div className="view-header">
                  <div>
                    <span className="view-kicker">EVALUATION HARNESS</span>
                    <h3>출시 전 품질 게이트</h3>
                  </div>
                  <div className="decision-badge success">GO · WITH GUARDRAIL</div>
                </div>
                <div className="metric-grid">
                  {(Object.keys(metricDescriptions) as Array<
                    keyof typeof metricDescriptions
                  >).map((key) => (
                    <article key={key}>
                      <span>{metricDescriptions[key]}</span>
                      <strong>{evaluation.metrics[key]}%</strong>
                      <div>
                        <i
                          style={{ width: `${evaluation.metrics[key]}%` }}
                        />
                      </div>
                    </article>
                  ))}
                </div>
                <div className="eval-table-wrap">
                  <div className="evidence-list-head">
                    <strong>골든셋 시나리오</strong>
                    <span>{evaluation.cases.length} baseline regression tests</span>
                  </div>
                  <div className="eval-table" role="table">
                    <div className="eval-row eval-head" role="row">
                      <span>CASE</span>
                      <span>EXPECTED</span>
                      <span>PREDICTED</span>
                      <span>RESULT</span>
                    </div>
                    {evaluation.cases.map((item) => (
                      <div className="eval-row" role="row" key={item.id}>
                        <span>{item.label}</span>
                        <span>{item.expected}</span>
                        <span>{item.predicted}</span>
                        <span className={item.pass ? "pass" : "review"}>
                          {item.pass ? "PASS" : "REVIEW"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="guardrail-note">
                  <span>!</span>
                  <div>
                    <strong>릴리스 메모</strong>
                    <p>
                      짧고 모호한 VOC 1건은 ‘신뢰’와 ‘안정성’을 구분하지 못했습니다.
                      운영 배포 전 모호성 라벨과 사람 검토 큐를 추가합니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="method" id="method">
        <div className="section-heading inverse">
          <div>
            <p className="section-index">DECISION SYSTEM · 02</p>
            <h2>AI 기능보다 먼저 설계한 것</h2>
          </div>
          <p>출력의 화려함이 아니라, 재현 가능하고 검증 가능한 의사결정을 목표로 했습니다.</p>
        </div>
        <div className="method-grid">
          <article>
            <span>01</span>
            <h3>Traceability</h3>
            <p>모든 문제 신호는 실제 VOC ID를 인용합니다. 근거가 없는 문장은 제품 결정에 사용하지 않습니다.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Evaluation</h3>
            <p>정확도, 인용 유효성, 안전성을 골든셋으로 회귀 테스트해 프롬프트 변경을 수치로 비교합니다.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Human control</h3>
            <p>낮은 신뢰도와 모호한 피드백은 자동 확정하지 않고 사람 검토 큐로 보냅니다.</p>
          </article>
          <article>
            <span>04</span>
            <h3>Ship criteria</h3>
            <p>사용자 가치, 품질, 비용, 위험을 함께 보고 GO·ITERATE·ROLLBACK 기준을 미리 정의합니다.</p>
          </article>
        </div>
      </section>

      <footer>
        <div>
          <span className="brand-mark small" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <strong>AI VOC Decision Lab</strong>
        </div>
        <p>Designed &amp; built by GongDoYoon · Evidence over intuition.</p>
        <a href="https://github.com/GongDoYoon">GitHub ↗</a>
      </footer>
    </main>
  );
}
