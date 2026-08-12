"use client";

import { useMemo, useState } from "react";
import { goldenCases } from "@/data/golden-set";
import { sampleFeedback } from "@/data/sample-feedback";
import {
  analyzeFeedback,
  buildPrd,
  evaluateGoldenSet,
  type ThemeKey,
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

export default function Home() {
  const analysis = useMemo(() => analyzeFeedback(sampleFeedback), []);
  const prd = useMemo(() => buildPrd(analysis), [analysis]);
  const evaluation = useMemo(
    () => evaluateGoldenSet(goldenCases, sampleFeedback),
    [],
  );
  const [view, setView] = useState<View>("discover");
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>(
    analysis.themes[0].key,
  );
  const [hasRun, setHasRun] = useState(false);

  const selected =
    analysis.themes.find((theme) => theme.key === selectedTheme) ??
    analysis.themes[0];
  const evidence = sampleFeedback.filter((item) =>
    selected.evidenceIds.includes(item.id),
  );

  function runAnalysis() {
    setHasRun(true);
    setView("discover");
    document
      .getElementById("workspace")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            <b>{hasRun ? "분석 완료" : "샘플 데이터"}</b>
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
              <dd>{sampleFeedback.length}</dd>
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
        <p>Local-first demo</p>
      </section>

      <section className="workspace" id="workspace">
        <div className="section-heading">
          <div>
            <p className="section-index">PRODUCT WORKSPACE · 01</p>
            <h2>하나의 VOC에서 출시 판단까지</h2>
          </div>
          <p>
            실제 API 키 없이도 분석·평가 흐름을 재현하며, 운영 환경에서는
            LLM 어댑터로 교체할 수 있습니다.
          </p>
        </div>

        <div className="app-shell">
          <aside className="app-sidebar">
            <div className="dataset-title">
              <span className="dataset-icon">D</span>
              <div>
                <strong>모바일 생산성 앱</strong>
                <p>최근 30일 VOC</p>
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
              <strong>24 / 24 valid</strong>
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
                  <div className="mode-pill">로컬 평가 엔진</div>
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
                        <span>0{index + 1}</span>
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
                    <span>{evaluation.cases.length} regression tests</span>
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
