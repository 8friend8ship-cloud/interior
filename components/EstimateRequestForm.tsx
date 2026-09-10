import React, { useMemo } from 'react';
import type { EstimateMarketplaceContext } from '../contracts/estimateMarketplace';
import type { EstimateRequestDraft } from '../contracts/estimateRequest';
import { buildEstimateRequestSchema, validateEstimateRequest } from '../services/estimateRequest';

interface Props {
  context: EstimateMarketplaceContext;
  value: EstimateRequestDraft;
  onChange: (draft: EstimateRequestDraft) => void;
}

export const EstimateRequestForm: React.FC<Props> = ({ context, value, onChange }) => {
  const schema = useMemo(() => buildEstimateRequestSchema(context), [context]);
  const qa = useMemo(() => validateEstimateRequest(schema, value), [schema, value]);
  const questions = [...schema.baseQuestions, ...schema.conditionalQuestions];

  const setAnswer = (questionId: string, answer: string | number | boolean | string[]) => {
    const next = { ...value, formSchemaId: schema.formSchemaId, version: schema.version, providerId: schema.providerId, answers: { ...value.answers, [questionId]: answer } };
    const validation = validateEstimateRequest(schema, next);
    onChange({ ...next, region: String(next.answers.region || ''), completedRequiredFields: validation.ok });
  };

  const toggleAttachment = (kind: string) => {
    const exists = value.attachmentKinds.includes(kind);
    const nextKinds = exists ? value.attachmentKinds.filter(k => k !== kind) : [...value.attachmentKinds, kind];
    const next = { ...value, formSchemaId: schema.formSchemaId, version: schema.version, attachmentKinds: nextKinds };
    const validation = validateEstimateRequest(schema, next);
    onChange({ ...next, completedRequiredFields: validation.ok });
  };

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">견적 의뢰서</p>
      <h2 className="mt-1 text-xl font-bold text-slate-900">조건에 맞게 질문이 자동으로 바뀝니다</h2>
      <p className="mt-1 text-sm text-slate-500">일반·비교견적·입찰·업체 자동화 모드에 따라 필요한 항목만 표시합니다.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {questions.map(question => {
          const current = value.answers[question.questionId];
          return (
            <label key={question.questionId} className="block">
              <span className="text-sm font-semibold text-slate-800">{question.label}{question.required ? ' *' : ''}</span>
              {question.type === 'SELECT' ? (
                <select value={String(current ?? '')} onChange={e => setAnswer(question.questionId, e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                  <option value="">선택</option>
                  {(question.options || []).map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : question.type === 'CHECKBOX' ? (
                <input type="checkbox" checked={Boolean(current)} onChange={e => setAnswer(question.questionId, e.target.checked)} className="mt-3 h-5 w-5" />
              ) : question.type === 'MULTISELECT' ? (
                <div className="mt-2 flex flex-wrap gap-2">{(question.options || []).map(option => { const selected = Array.isArray(current) && current.includes(option); return <button type="button" key={option} onClick={() => { const base = Array.isArray(current) ? current : []; setAnswer(question.questionId, selected ? base.filter(v => v !== option) : [...base, option]); }} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${selected ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>{option}</button>; })}</div>
              ) : (
                <input type={question.type === 'DATE' ? 'date' : question.type === 'NUMBER' ? 'number' : 'text'} value={String(current ?? '')} onChange={e => setAnswer(question.questionId, question.type === 'NUMBER' ? Number(e.target.value) : e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              )}
            </label>
          );
        })}
      </div>

      {schema.requiredAttachments.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><div className="text-sm font-semibold text-slate-800">필수 자료 확인</div><div className="mt-2 flex flex-wrap gap-2">{schema.requiredAttachments.map(kind => { const selected = value.attachmentKinds.includes(kind); return <button type="button" key={kind} onClick={() => toggleAttachment(kind)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${selected ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>{selected ? '✓ ' : ''}{kind}</button>; })}</div></div>}

      <div className={`mt-4 rounded-xl p-3 text-sm ${qa.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{qa.ok ? '필수 견적 의뢰 항목이 준비됐습니다.' : `남은 필수항목: ${qa.missingQuestionIds.join(', ')}`}</div>
    </section>
  );
};
