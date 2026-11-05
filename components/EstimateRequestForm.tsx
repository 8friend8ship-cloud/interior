import React, { useMemo, useState } from 'react';
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
  const [showOptional, setShowOptional] = useState(false);
  const optionalCount = questions.filter(question => !question.required).length;
  const readableNames: Record<string, string> = { budget: '실속형', standard: '표준형', high_end: '고급형', APP: '앱에서 확인', EMAIL: '이메일', PHONE: '전화' };
  const missingLabels = qa.missingQuestionIds.map(id => questions.find(q => q.questionId === id)?.label || (id.startsWith('attachment:') ? `필수 자료: ${id.slice(11)}` : id));

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
      <h2 className="mt-1 text-xl font-bold text-slate-900">지역과 자재 등급을 먼저 알려주세요</h2>
      <p className="mt-1 text-sm text-slate-500">필수 정보만 먼저 입력하세요. 추가 옵션은 필요할 때 펼칠 수 있습니다.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {questions.map(question => {
          if (!question.required && !showOptional) return null;
          const current = value.answers[question.questionId];
          return (
            <label key={question.questionId} className="block">
              <span className="text-sm font-semibold text-slate-800">{question.label}{question.required ? ' *' : ''}</span>
              {question.type === 'SELECT' ? (
                <select value={String(current ?? '')} onChange={e => setAnswer(question.questionId, e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                  <option value="">선택</option>
                  {(question.options || []).map(option => <option key={option} value={option}>{readableNames[option] || option}</option>)}
                </select>
              ) : question.type === 'CHECKBOX' ? (
                <input type="checkbox" checked={Boolean(current)} onChange={e => setAnswer(question.questionId, e.target.checked)} className="mt-3 h-5 w-5" />
              ) : question.type === 'MULTISELECT' ? (
                <div className="mt-2 flex flex-wrap gap-2">{(question.options || []).map(option => { const selected = Array.isArray(current) && current.includes(option); return <button type="button" key={option} onClick={() => { const base = Array.isArray(current) ? current : []; setAnswer(question.questionId, selected ? base.filter(v => v !== option) : [...base, option]); }} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${selected ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>{option}</button>; })}</div>
              ) : (
                <input type={question.type === 'DATE' ? 'date' : question.type === 'NUMBER' ? 'number' : 'text'} value={String(current ?? '')} onChange={e => setAnswer(question.questionId, question.type === 'NUMBER' ? Number(e.target.value) : e.target.value)} placeholder={question.questionId === 'region' ? '예: 서울 강남구' : undefined} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              )}
            </label>
          );
        })}
      </div>
      {optionalCount > 0 && (
        <button type="button" aria-expanded={showOptional} onClick={() => setShowOptional(value => !value)}
          className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
          {showOptional ? '선택 항목 접기' : `선택 항목 ${optionalCount}개 더 보기`}
        </button>
      )}

      {schema.requiredAttachments.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><div className="text-sm font-semibold text-slate-800">필수 자료 확인</div><div className="mt-2 flex flex-wrap gap-2">{schema.requiredAttachments.map(kind => { const selected = value.attachmentKinds.includes(kind); return <button type="button" key={kind} onClick={() => toggleAttachment(kind)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${selected ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>{selected ? '✓ ' : ''}{kind}</button>; })}</div></div>}

      <div className={`mt-4 rounded-xl p-3 text-sm ${qa.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{qa.ok ? '필수 견적 의뢰 항목이 준비됐습니다.' : `남은 필수항목: ${missingLabels.join(', ')}`}</div>
    </section>
  );
};
