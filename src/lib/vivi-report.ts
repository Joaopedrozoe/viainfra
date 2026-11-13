import jsPDF from "jspdf";
import type { ViviInsight } from "@/hooks/useViviAgent";

type Counter = Map<string, number>;
const inc = (m: Counter, k?: string | null) => { if (k && k.trim()) m.set(k.trim(), (m.get(k.trim()) || 0) + 1); };
const top = (m: Counter, n: number) => Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, n);
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);

export function buildViviReportData(insights: ViviInsight[]) {
  const sentiment: Record<string, number> = { positivo: 0, neutro: 0, negativo: 0 };
  const topics: Counter = new Map(), depts: Counter = new Map(), gaps: Counter = new Map(),
    questions: Counter = new Map(), replies: Counter = new Map(), templates: Counter = new Map(),
    opps: Counter = new Map(), lowDept: Counter = new Map();
  let scoreSum = 0, scoreN = 0;
  for (const i of insights) {
    if (i.sentiment && sentiment[i.sentiment] !== undefined) sentiment[i.sentiment]++;
    if (typeof i.score === "number") { scoreSum += i.score; scoreN++; if (i.score < 60) inc(lowDept, i.department); }
    (i.topics || []).forEach((t) => inc(topics, t));
    inc(depts, i.department);
    const d = (i.data || {}) as Record<string, unknown>;
    arr(d.service_gaps).forEach((x) => inc(gaps, x));
    arr(d.unresolved_questions).forEach((x) => inc(questions, x));
    arr(d.suggested_quick_replies).forEach((x) => inc(replies, x));
    arr(d.suggested_template_ideas).forEach((x) => inc(templates, x));
    if (typeof d.opportunity === "string") inc(opps, d.opportunity);
  }
  const total = insights.length;
  const avg = scoreN ? Math.round((scoreSum / scoreN) * 10) / 10 : null;
  const negPct = total ? Math.round((sentiment.negativo / total) * 100) : 0;
  const topTopics = top(topics, 10);

  const actions: { area: string; action: string; why: string }[] = [];
  topTopics.slice(0, 4).forEach(([t, c]) => actions.push({ area: "Automação (chatbot)", action: `Criar fluxo automático no bot para o assunto "${t}"`, why: `${c} conversas recorrentes sobre o tema` }));
  top(questions, 3).forEach(([q, c]) => actions.push({ area: "Base de conhecimento", action: `Documentar resposta padrão: "${q}"`, why: `${c} pergunta(s) não resolvida(s)` }));
  top(replies, 3).forEach(([r]) => actions.push({ area: "Respostas rápidas", action: `Cadastrar resposta rápida: "${r}"`, why: "Sugerida pela Vivi para reduzir tempo de resposta" }));
  top(templates, 2).forEach(([t]) => actions.push({ area: "Templates Meta", action: `Submeter template: "${t}"`, why: "Comunicação proativa recorrente" }));
  top(lowDept, 2).forEach(([d, c]) => actions.push({ area: "Gargalo operacional", action: `Revisar processo e SLA do setor ${d}`, why: `${c} atendimento(s) com nota abaixo de 60` }));
  if (negPct >= 20) actions.push({ area: "Qualidade", action: "Implantar alerta automático de conversa negativa para supervisor", why: `${negPct}% das conversas com sentimento negativo` });
  actions.push({ area: "Integração T.I", action: "Integrar o bot ao ERP/TMS para consulta automática de status, disponibilidade e orçamento", why: "Elimina transferências manuais para perguntas de rotina" });
  actions.push({ area: "Dados / BI", action: "Exportar indicadores da Vivi para painel de BI semanal (sentimento, nota, gargalos)", why: "Acompanhamento contínuo pela diretoria" });

  return { total, sentiment, avg, negPct, topTopics, depts: top(depts, 10), gaps: top(gaps, 8), questions: top(questions, 8), opps: top(opps, 6), actions };
}

export function generateViviReportPdf(insights: ViviInsight[], companyName: string, periodLabel: string) {
  const r = buildViviReportData(insights);
  const pdf = new jsPDF("p", "mm", "a4");
  const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight(), M = 15;
  let y = M;
  const ensure = (h: number) => { if (y + h > H - M) { pdf.addPage(); y = M; } };
  const text = (s: string, size = 10, bold = false, indent = 0) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal"); pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(s, W - 2 * M - indent);
    lines.forEach((l: string) => { ensure(size * 0.5); pdf.text(l, M + indent, y); y += size * 0.45; });
    y += 1;
  };
  const section = (t: string) => { y += 3; ensure(12); pdf.setFillColor(40, 40, 40); pdf.rect(M, y - 5, W - 2 * M, 8, "F"); pdf.setTextColor(255, 255, 255); text(t, 12, true, 2); pdf.setTextColor(0, 0, 0); y += 1; };
  const list = (items: [string, number][], empty = "Sem dados no período.") => { if (!items.length) return text(empty, 10); items.forEach(([k, c]) => text(`• ${k} (${c})`, 10, false, 2)); };

  text(`Relatório Executivo de Insights — Vivi IA`, 18, true);
  text(`${companyName} · Período: ${periodLabel} · Gerado em ${new Date().toLocaleString("pt-BR")}`, 9);

  section("1. Resumo para a Diretoria");
  text(`Conversas analisadas: ${r.total}`);
  text(`Nota média de atendimento: ${r.avg ?? "—"} / 100`);
  text(`Sentimento: ${r.sentiment.positivo} positivo · ${r.sentiment.neutro} neutro · ${r.sentiment.negativo} negativo (${r.negPct}% negativo)`);
  text(`Assunto mais frequente: ${r.topTopics[0]?.[0] ?? "—"}`);

  section("2. Visão Gerencial — Demanda por setor");
  list(r.depts);
  section("Principais assuntos");
  list(r.topTopics);

  section("3. Gargalos identificados");
  list(r.gaps, "Nenhuma falha de atendimento registrada.");
  section("Perguntas não resolvidas");
  list(r.questions);
  section("Oportunidades comerciais");
  list(r.opps);

  section("4. Plano de Ação — Time de T.I e Automação");
  r.actions.forEach((a, i) => { text(`${i + 1}. [${a.area}] ${a.action}`, 10, true, 2); text(`Motivo: ${a.why}`, 9, false, 6); });

  const pages = pdf.getNumberOfPages();
  for (let p = 1; p <= pages; p++) { pdf.setPage(p); pdf.setFontSize(8); pdf.text(`Vivi IA · ${companyName} · página ${p}/${pages}`, M, H - 8); }
  pdf.save(`Vivi-Insights-${companyName.replace(/\s+/g, "_")}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
