// HomeDesign concept/field sash panel design gate. No geometry or procurement approval.
export function checkPanel({width_mm,width_basis,panel_count,continuous_boundary_verified,product_compatible},mode='concept'){
  if(!['concept','field'].includes(mode))throw new Error('Invalid mode');
  if(!Number.isFinite(width_mm)||width_mm<=0)return 'HOLD_WIDTH';
  if(mode==='field'&&(width_basis!=='MEASURED_ROUGH_OPENING'||continuous_boundary_verified!==true))return 'HOLD_FIELD_EVIDENCE';
  if(product_compatible===false)return 'HOLD_PRODUCT_CONFLICT';
  if(width_mm>2700&&panel_count!==3)return 'HOLD_THREE_PANELS_REQUIRED';
  if(!Number.isInteger(panel_count)||panel_count<1)return 'HOLD_PANEL_LAYOUT';
  if(mode==='field'&&product_compatible!==true)return 'HOLD_PRODUCT_EVIDENCE';
  return mode==='field'?'PANEL_RULE_PASS_ONLY':'CONCEPT_PANEL_RULE_PASS_ONLY';
}
if(process.argv.includes('--self-test')){
 const c=(w,p)=>checkPanel({width_mm:w,panel_count:p});
 const t=[
 [c(2699,2),'CONCEPT_PANEL_RULE_PASS_ONLY'],[c(2700,2),'CONCEPT_PANEL_RULE_PASS_ONLY'],
 [c(2700.1,2),'HOLD_THREE_PANELS_REQUIRED'],[c(2701,3),'CONCEPT_PANEL_RULE_PASS_ONLY'],
 [c(2850,2),'HOLD_THREE_PANELS_REQUIRED'],[c(2875,3),'CONCEPT_PANEL_RULE_PASS_ONLY'],
 [c(null,3),'HOLD_WIDTH'],[c(2700,null),'HOLD_PANEL_LAYOUT'],
 [checkPanel({width_mm:3000,panel_count:3,width_basis:'FRAME_BOUND'},'field'),'HOLD_FIELD_EVIDENCE'],
 [checkPanel({width_mm:3000,panel_count:3,width_basis:'MEASURED_ROUGH_OPENING',continuous_boundary_verified:true,product_compatible:false},'field'),'HOLD_PRODUCT_CONFLICT'],
 [checkPanel({width_mm:3000,panel_count:3,width_basis:'MEASURED_ROUGH_OPENING',continuous_boundary_verified:true,product_compatible:true},'field'),'PANEL_RULE_PASS_ONLY'],
 [checkPanel({width_mm:3000,panel_count:3,width_basis:'MEASURED_ROUGH_OPENING',continuous_boundary_verified:false,product_compatible:true},'field'),'HOLD_FIELD_EVIDENCE']
 ];if(t.some(([a,b])=>a!==b))throw new Error(JSON.stringify(t));console.log(t.length+'/'+t.length+' PASS');
}
