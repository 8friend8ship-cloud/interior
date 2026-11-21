/**
 * HOME DESIGN >3000mm three-visible-glazed-section DESIGN PREFERENCE.
 *
 * Never treats frame component bounds as site-measured rough openings.
 * Historical two-glass-section components are read-only study evidence.
 * The caller cannot self-approve an exception by flags, arbitrary IDs or URLs.
 * A future authenticated approval service must provide separate proof.
 * PASS_ONLY refers to this one policy, never product fitness or permission to cut.
 */
const LEGACY_2_SECTION_SOURCE=Object.freeze({
  GURI_32_2:3050.00,
  GURI_32_5:3106.98,
  HANAM_32_3:3200.00,
  HANAM_32_6:3162.52,
  HANAM_32_7:3162.52
});

export function checkPanel(input, mode='concept') {
  if(!['concept','field'].includes(mode))throw Error('Invalid mode');
  const x=input||{};
  const {width_mm,width_basis,continuous_boundary_verified,product_compatible,
    manufacturer_system_verified,panel_layout_per_track_verified,
    double_sash=false,each_track_layout_verified,
    context='new_design',legacy_source_id}=x;
  if(!Number.isFinite(width_mm)||width_mm<=0)return 'HOLD_WIDTH';
  const sections=x.glazed_sections??x.panel_count;
  if(x.glazed_sections!==undefined && x.panel_count!==undefined &&
      x.glazed_sections!==x.panel_count)return 'HOLD_PANEL_INPUT_CONFLICT';
  if(!Number.isInteger(sections)||sections<1||sections>12)return 'HOLD_PANEL_LAYOUT';
  if(context==='existing_asset'){
    // Known source ID + exact native frame bounding width + two glazed sections.
    // It is never transferred to new-site approval.
    if(mode!=='concept')return 'HOLD_HISTORICAL_ASSET_NOT_FIELD_APPROVED';
    if(typeof legacy_source_id!=='string'||!Object.hasOwn(LEGACY_2_SECTION_SOURCE,legacy_source_id))
      return 'HOLD_UNREGISTERED_HISTORICAL_ASSET';
    if(width_basis!=='FRAME_BBOX_NATIVE')return 'HOLD_SOURCE_WIDTH_BASIS';
    if(Math.abs(LEGACY_2_SECTION_SOURCE[legacy_source_id]-width_mm)>0.3)
      return 'HOLD_LEGACY_ID_WIDTH_MISMATCH';
    if(sections!==2)return 'HOLD_LEGACY_GEOMETRY_MISMATCH';
    return 'HISTORICAL_2_SECTION_SOURCE_ONLY';
  }
  if(context!=='new_design')return 'HOLD_UNKNOWN_CONTEXT';
  if(width_basis==='FRAME_BBOX_NATIVE'||width_basis==='FRAME_BBOX'){
    return 'RESEARCH_ONLY_FRAME_BBOX_NOT_OPENING';
  }
  if(width_basis===undefined||!['DRAWING_PROVISIONAL','MEASURED_ROUGH_OPENING'].includes(width_basis)){
    return 'HOLD_WIDTH_PROVENANCE';
  }
  if(mode==='field' && (width_basis!=='MEASURED_ROUGH_OPENING'||continuous_boundary_verified!==true))
    return 'HOLD_FIELD_EVIDENCE';
  if(product_compatible===false)return 'HOLD_PRODUCT_CONFLICT';

  if(width_mm>3000 && sections!==3) {
    // Independent, authenticated external approval is NOT integrated here.
    // Even user-supplied exception_approved/url are insufficient.
    return 'HOLD_3_SECTION_PREFERENCE_INDEPENDENT_REVIEW';
  }
  if(width_basis==='DRAWING_PROVISIONAL'){
    return width_mm>3000?'CONCEPT_3_SECTION_PROPOSAL_ONLY':'CONCEPT_LAYOUT_PROVISIONAL_ONLY';
  }
  if(continuous_boundary_verified!==true)return 'HOLD_OPENING_BOUNDARY';
  if(mode==='concept')return 'CONCEPT_POLICY_CHECK_ONLY';
  if(product_compatible!==true||manufacturer_system_verified!==true)
    return 'HOLD_PRODUCT_EVIDENCE';
  if(panel_layout_per_track_verified!==true)return 'HOLD_PANEL_LAYOUT_PER_TRACK';
  if(double_sash===true&&each_track_layout_verified!==true)
    return 'HOLD_DOUBLE_SASH_TRACKS';
  return 'PANEL_POLICY_CHECK_ONLY';
}

if(process.argv.includes('--self-test')){
 const run=(width,sections,extra={},mode='concept')=>
   checkPanel({width_mm:width,glazed_sections:sections,...extra},mode);
 const measured={width_basis:'MEASURED_ROUGH_OPENING',continuous_boundary_verified:true};
 const field={...measured,product_compatible:true,manufacturer_system_verified:true,panel_layout_per_track_verified:true};
 const existing=(id,w,sections=2,extra={})=>run(w,sections,{width_basis:'FRAME_BBOX_NATIVE',context:'existing_asset',legacy_source_id:id,...extra});
 const t=[
  [run(2700,2,{width_basis:'DRAWING_PROVISIONAL'}),'CONCEPT_LAYOUT_PROVISIONAL_ONLY'],
  [run(2850,2,{width_basis:'DRAWING_PROVISIONAL'}),'CONCEPT_LAYOUT_PROVISIONAL_ONLY'],
  [run(3000,2,{width_basis:'DRAWING_PROVISIONAL'}),'CONCEPT_LAYOUT_PROVISIONAL_ONLY'],
  [run(3000.01,2,{width_basis:'DRAWING_PROVISIONAL'}),'HOLD_3_SECTION_PREFERENCE_INDEPENDENT_REVIEW'],
  [run(3000.01,3,{width_basis:'DRAWING_PROVISIONAL'}),'CONCEPT_3_SECTION_PROPOSAL_ONLY'],
  [run(3000,2,measured),'CONCEPT_POLICY_CHECK_ONLY'],
  [run(3000.01,3,measured),'CONCEPT_POLICY_CHECK_ONLY'],
  [run(3000.01,2,measured),'HOLD_3_SECTION_PREFERENCE_INDEPENDENT_REVIEW'],
  [run(3200,3,{width_basis:'FRAME_BBOX_NATIVE'}),'RESEARCH_ONLY_FRAME_BBOX_NOT_OPENING'],
  [run(3200,3),'HOLD_WIDTH_PROVENANCE'],
  [existing('GURI_32_2',3050),'HISTORICAL_2_SECTION_SOURCE_ONLY'],
  [existing('GURI_32_5',3106.98),'HISTORICAL_2_SECTION_SOURCE_ONLY'],
  [existing('HANAM_32_3',3200),'HISTORICAL_2_SECTION_SOURCE_ONLY'],
  [existing('HANAM_32_6',3162.52),'HISTORICAL_2_SECTION_SOURCE_ONLY'],
  [existing('HANAM_32_7',3162.52),'HISTORICAL_2_SECTION_SOURCE_ONLY'],
  [existing('   ',3200),'HOLD_UNREGISTERED_HISTORICAL_ASSET'],
  [existing('GURI_32_2',3300),'HOLD_LEGACY_ID_WIDTH_MISMATCH'],
  [existing('GURI_32_2',3050,4),'HOLD_LEGACY_GEOMETRY_MISMATCH'],
  [existing('GURI_32_2',3050,2,{width_basis:'MEASURED_ROUGH_OPENING'}),'HOLD_SOURCE_WIDTH_BASIS'],
  [run(3050,2,{...measured,exception_approved:true,exception_receipt_url:'https://example.invalid/a',manufacturer_system_verified:true,product_compatible:true}),'HOLD_3_SECTION_PREFERENCE_INDEPENDENT_REVIEW'],
  [run(3200,2,{...measured,exception_approved:true,exception_receipt_url:'https://',manufacturer_system_verified:true,product_compatible:true}),'HOLD_3_SECTION_PREFERENCE_INDEPENDENT_REVIEW'],
  [run(3200,3,{...measured,panel_count:2}),'HOLD_PANEL_INPUT_CONFLICT'],
  [run(3200,3,{...measured,product_compatible:false}),'HOLD_PRODUCT_CONFLICT'],
  [run(3200,null,measured),'HOLD_PANEL_LAYOUT'],
  [run(null,3,measured),'HOLD_WIDTH'],
  [run(3400,3,{width_basis:'MEASURED_ROUGH_OPENING'},'field'),'HOLD_FIELD_EVIDENCE'],
  [run(3400,3,{...measured,product_compatible:true,manufacturer_system_verified:true},'field'),'HOLD_PANEL_LAYOUT_PER_TRACK'],
  [run(3400,3,{...field,product_compatible:false},'field'),'HOLD_PRODUCT_CONFLICT'],
  [run(3400,3,field,'field'),'PANEL_POLICY_CHECK_ONLY'],
  [run(3400,3,{...field,double_sash:true},'field'),'HOLD_DOUBLE_SASH_TRACKS'],
  [run(3400,3,{...field,double_sash:true,each_track_layout_verified:true},'field'),'PANEL_POLICY_CHECK_ONLY'],
  [run(3400,2,{...field,exception_approved:true},'field'),'HOLD_3_SECTION_PREFERENCE_INDEPENDENT_REVIEW'],
  [run(3400,3,{...field,context:'existing_asset',legacy_source_id:'GURI_32_2'},'field'),'HOLD_HISTORICAL_ASSET_NOT_FIELD_APPROVED'],
  [run(3400,3,{width_basis:'NOT_KNOWN'},'concept'),'HOLD_WIDTH_PROVENANCE']
 ];
 const bad=t.filter(([actual,want])=>actual!==want);
 if(bad.length)throw Error(JSON.stringify(bad));
 console.log(t.length+'/'+t.length+' PASS | approved exceptions cannot self-certify | source bbox not opening');
}
