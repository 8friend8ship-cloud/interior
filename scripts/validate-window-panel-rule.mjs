/**
 * HOME DESIGN window glazed-panel design preference.
 * 3000mm is a PROVISIONAL NEW-DESIGN preference; it is not a universal
 * manufacturer requirement. Old 2-section source assets are preserved.
 * No decision here authorizes field cuts, purchase, sash engineering, or BOM.
 */
export function checkPanel(input, mode='concept') {
  if (!['concept','field'].includes(mode)) throw Error('Invalid mode');
  const {width_mm,width_basis,continuous_boundary_verified,product_compatible,
    context='new_design',legacy_source_id,legacy_geometry_verified=false,
    exception_approved=false,exception_receipt_url,manufacturer_system_verified=false}=input||{};
  const count=input?.glazed_sections ?? input?.panel_count;
  if (!Number.isFinite(width_mm)||width_mm<=0) return 'HOLD_WIDTH';
  if (!Number.isInteger(count)||count<1) return 'HOLD_PANEL_LAYOUT';
  if (mode==='field' && (width_basis!=='MEASURED_ROUGH_OPENING' || continuous_boundary_verified!==true)) return 'HOLD_FIELD_EVIDENCE';
  if (product_compatible===false) return 'HOLD_PRODUCT_CONFLICT';
  // Historical source study is never itself a site-approved fitting specification.
  if (context==='existing_asset' && mode==='concept' && width_mm>3000 && count!==3 &&
      typeof legacy_source_id==='string' && legacy_source_id.length>=3 && legacy_geometry_verified===true) {
    return 'HISTORICAL_EXCEPTION_RECORDED_NO_AUTO_CONVERSION';
  }
  if (width_mm>3000 && count!==3) {
    const supportedException=exception_approved===true &&
      typeof exception_receipt_url==='string' && /^https:\/\//.test(exception_receipt_url) &&
      manufacturer_system_verified===true && product_compatible===true;
    if (!supportedException) return 'HOLD_3_SECTION_PREFERENCE_REVIEW';
    if (mode==='field') return 'EXCEPTION_PANEL_RULE_PASS_ONLY';
    return 'CONCEPT_EXCEPTION_REVIEW_PASS_ONLY';
  }
  if (mode==='field' && (product_compatible!==true || manufacturer_system_verified!==true)) return 'HOLD_PRODUCT_EVIDENCE';
  return mode==='field'?'PANEL_RULE_PASS_ONLY':'CONCEPT_PANEL_RULE_PASS_ONLY';
}

if (process.argv.includes('--self-test')) {
 const run=(width,panels,extra={},mode='concept')=>checkPanel({width_mm:width,panel_count:panels,...extra},mode);
 const field=(width,panels,extra={})=>run(width,panels,{width_basis:'MEASURED_ROUGH_OPENING',continuous_boundary_verified:true,product_compatible:true,manufacturer_system_verified:true,...extra},'field');
 const test=[
  [run(2700,2),'CONCEPT_PANEL_RULE_PASS_ONLY'],
  [run(2700.1,2),'CONCEPT_PANEL_RULE_PASS_ONLY'],
  [run(2850,2),'CONCEPT_PANEL_RULE_PASS_ONLY'],
  [run(2875,3),'CONCEPT_PANEL_RULE_PASS_ONLY'],
  [run(3000,2),'CONCEPT_PANEL_RULE_PASS_ONLY'],
  [run(3000.01,2),'HOLD_3_SECTION_PREFERENCE_REVIEW'],
  [run(3000.01,3),'CONCEPT_PANEL_RULE_PASS_ONLY'],
  [run(3050,2,{context:'existing_asset',legacy_source_id:'GURI_32_2',legacy_geometry_verified:true}),'HISTORICAL_EXCEPTION_RECORDED_NO_AUTO_CONVERSION'],
  [run(3107,2,{context:'existing_asset',legacy_source_id:'GURI_32_5',legacy_geometry_verified:true}),'HISTORICAL_EXCEPTION_RECORDED_NO_AUTO_CONVERSION'],
  [run(3163,2,{context:'existing_asset',legacy_source_id:'HANAM_32_6',legacy_geometry_verified:true}),'HISTORICAL_EXCEPTION_RECORDED_NO_AUTO_CONVERSION'],
  [run(3200,2),'HOLD_3_SECTION_PREFERENCE_REVIEW'],
  [run(3200,2,{exception_approved:true,exception_receipt_url:'https://example.invalid/a',manufacturer_system_verified:true,product_compatible:true}),'CONCEPT_EXCEPTION_REVIEW_PASS_ONLY'],
  [run(3200,2,{exception_approved:true,manufacturer_system_verified:true,product_compatible:true}),'HOLD_3_SECTION_PREFERENCE_REVIEW'],
  [run(3700,3),'CONCEPT_PANEL_RULE_PASS_ONLY'],
  [run(4400,3),'CONCEPT_PANEL_RULE_PASS_ONLY'],
  [run(null,3),'HOLD_WIDTH'],
  [run(2700,null),'HOLD_PANEL_LAYOUT'],
  [run(3400,3,{product_compatible:false}),'HOLD_PRODUCT_CONFLICT'],
  [run(3400,3,{width_basis:'FRAME_BBOX',continuous_boundary_verified:true,product_compatible:true,manufacturer_system_verified:true},'field'),'HOLD_FIELD_EVIDENCE'],
  [run(3400,3,{width_basis:'MEASURED_ROUGH_OPENING',continuous_boundary_verified:false,product_compatible:true,manufacturer_system_verified:true},'field'),'HOLD_FIELD_EVIDENCE'],
  [run(3400,3,{width_basis:'MEASURED_ROUGH_OPENING',continuous_boundary_verified:true,product_compatible:true},'field'),'HOLD_PRODUCT_EVIDENCE'],
  [field(3400,3),'PANEL_RULE_PASS_ONLY'],
  [field(3400,2),'HOLD_3_SECTION_PREFERENCE_REVIEW'],
  [field(3400,2,{exception_approved:true,exception_receipt_url:'https://example.invalid/review'}),'EXCEPTION_PANEL_RULE_PASS_ONLY']
 ];
 const mismatches=test.filter(([actual,expected])=>actual!==expected);
 if(mismatches.length)throw Error(JSON.stringify(mismatches));
 console.log(test.length+'/'+test.length+' PASS | 3000mm strict boundary / historical exceptions / field guards');
}
