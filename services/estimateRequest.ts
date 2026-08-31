import type { EstimateMarketplaceContext, RequestFormQuestion, RequestFormSchema } from '../contracts/estimateMarketplace';
import type { EstimateMaterialGrade, EstimateRequestDraft, EstimateRequestRoute, EstimateRequestValidation } from '../contracts/estimateRequest';

const q = (question: RequestFormQuestion): RequestFormQuestion => question;
const MATERIAL_GRADES: EstimateMaterialGrade[] = ['budget', 'standard', 'high_end'];

export function buildEstimateRequestSchema(context: EstimateMarketplaceContext): RequestFormSchema {
  const baseQuestions: RequestFormQuestion[] = [
    q({ questionId:'region', canonicalField:'region', label:'시공 지역', type:'TEXT', required:true, source:'BASE', privacyClass:'CUSTOMER' }),
    q({ questionId:'materialGrade', canonicalField:'materialGrade', label:'자재 등급', type:'SELECT', required:true, options:MATERIAL_GRADES, source:'BASE', privacyClass:'CUSTOMER' }),
    q({ questionId:'contactMethod', canonicalField:'contactMethod', label:'견적 회신 방법', type:'SELECT', required:true, options:['APP','EMAIL','PHONE'], source:'BASE', privacyClass:'CUSTOMER' }),
    q({ questionId:'desiredDate', canonicalField:'desiredDate', label:'희망 착공일', type:'DATE', required:false, source:'BASE', privacyClass:'CUSTOMER' }),
    q({ questionId:'siteVisit', canonicalField:'siteVisit', label:'현장 방문 필요', type:'CHECKBOX', required:false, source:'BASE', privacyClass:'CUSTOMER' }),
  ];

  const conditionalQuestions: RequestFormQuestion[] = [];
  if (context.userRole === 'CONSUMER' && context.consumerMode === 'COMPARE') {
    conditionalQuestions.push(q({ questionId:'compareCount', canonicalField:'compareCount', label:'비교받을 업체 수', type:'SELECT', required:true, options:['2','3','5'], source:'TEMPLATE', privacyClass:'CUSTOMER' }));
  }
  if (context.userRole === 'CONSUMER' && context.consumerMode === 'TENDER') {
    conditionalQuestions.push(
      q({ questionId:'tenderDeadline', canonicalField:'tenderDeadline', label:'입찰 마감일', type:'DATE', required:true, source:'TEMPLATE', privacyClass:'CUSTOMER' }),
      q({ questionId:'bidPackage', canonicalField:'bidPackage', label:'필요 입찰 자료', type:'MULTISELECT', required:true, options:['BOQ','SCHEDULE','DRAWING','PERSPECTIVE','REPORT'], source:'TEMPLATE', privacyClass:'CUSTOMER' })
    );
  }
  if (context.userRole === 'SUPPLIER' && context.supplierMode === 'REGISTER_BID') {
    conditionalQuestions.push(q({ questionId:'providerRegistration', canonicalField:'providerRegistration', label:'업체 등록 확인', type:'CHECKBOX', required:true, source:'PROVIDER', privacyClass:'CUSTOMER' }));
  }
  if (context.userRole === 'SUPPLIER' && context.supplierMode === 'AUTOMATION') {
    conditionalQuestions.push(q({ questionId:'pricingProfile', canonicalField:'pricingProfile', label:'사용할 업체 단가 프로필', type:'TEXT', required:true, source:'PROVIDER', privacyClass:'SENSITIVE' }));
  }

  return {
    formSchemaId: `${context.userRole}_${context.consumerMode || context.supplierMode || 'DEFAULT'}_${context.projectDomain || 'RESIDENTIAL_INTERIOR'}`,
    providerId: context.providerId,
    version: 'ESTIMATE_REQUEST_V2_20260831',
    baseQuestions,
    conditionalQuestions,
    requiredAttachments: context.consumerMode === 'TENDER' ? ['PLAN','SITE_PHOTO'] : [],
    templateRequirements: context.consumerMode === 'TENDER' ? ['BOQ','SCHEDULE'] : [],
  };
}

export function validateEstimateRequest(schema: RequestFormSchema, draft: EstimateRequestDraft): EstimateRequestValidation {
  const visibleQuestions = [...schema.baseQuestions, ...schema.conditionalQuestions];
  const missingQuestionIds = visibleQuestions.filter(question => {
    if (!question.required) return false;
    const value = draft.answers[question.questionId];
    if (Array.isArray(value)) return value.length === 0;
    return value === undefined || value === null || value === '' || value === false;
  }).map(q => q.questionId);
  for (const requiredKind of schema.requiredAttachments) if (!draft.attachmentKinds.includes(requiredKind)) missingQuestionIds.push(`attachment:${requiredKind}`);
  return { ok: missingQuestionIds.length === 0, missingQuestionIds, visibleQuestions };
}

export function resolveEstimateRequestRoute(context: EstimateMarketplaceContext, draft: EstimateRequestDraft): EstimateRequestRoute {
  const schema = buildEstimateRequestSchema(context);
  const region = String(draft.region || draft.answers.region || '').trim();
  const requestedGrade = String(draft.materialGrade || draft.answers.materialGrade || '').trim() as EstimateMaterialGrade;
  const materialGrade: EstimateMaterialGrade = MATERIAL_GRADES.includes(requestedGrade) ? requestedGrade : 'standard';
  const mode: EstimateRequestRoute['mode'] = context.providerId ? 'PROVIDER' : context.templateMode === 'USER_CUSTOM' ? 'CUSTOM' : 'STANDARD';
  return {
    routeId: `${region || 'UNROUTED'}:${materialGrade}:${context.providerId || 'STANDARD'}:${schema.formSchemaId}`,
    region,
    materialGrade,
    providerId: context.providerId,
    mode,
    schema,
  };
}
