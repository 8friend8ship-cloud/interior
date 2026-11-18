# frozen_string_literal: true
# Isolated 2026-11-18 SEED_SKP_01 root four real inner-loop faces Native SketchUp mesh.
# Never save model. Sanitized reusable template; protected paths, GUID and face IDs are supplied at runtime.
require 'json'
require 'time'
module Seed01FourHoleNativeV3
  extend self
  BASE=ENV.fetch('SEED01_QA_PRIVATE_DIR')
  TARGET=File.join(BASE,'SEED_SKP_01_QA_COPY_READONLY.skp')
  EXPECTED_GUID=ENV.fetch('SEED01_QA_MODEL_GUID')
  PIDS=ENV.fetch('SEED01_QA_FOUR_FACE_IDS').split(',').map(&:to_i).sort.freeze
  RUN=ENV.fetch('INTERIOR_SEED01_FOUR_HOLE_RUN','INVALID')
  MM=25.4
  def mm(p)
    [p.x.to_f*MM,p.y.to_f*MM,p.z.to_f*MM].map{|v|v.round(3)}
  end
  def write_once(file,data)
    raise 'HOLD_REFUSE_OVERWRITE' if File.exist?(file)
    File.open(file,'w:UTF-8'){|io| io.write(JSON.generate(data)+"\n")}
  end
  def area3(p)
    a,b,c=p
    u=3.times.map{|i|b[i]-a[i]};v=3.times.map{|i|c[i]-a[i]}
    x=u[1]*v[2]-u[2]*v[1];y=u[2]*v[0]-u[0]*v[2];z=u[0]*v[1]-u[1]*v[0]
    0.5*Math.sqrt(x*x+y*y+z*z)
  end
  def run(attempt=0)
    should_quit=false
    raise 'HOLD_INVALID_RUN' unless %w[X1 X2].include?(RUN)
    raise 'HOLD_INVALID_FACE_IDS' unless PIDS.size==4 && PIDS.uniq.size==4 && PIDS.all?{|i|i>0}
    m=Sketchup.active_model
    expected=File.expand_path(TARGET).tr('\\','/').downcase
    actual=m.path.to_s.tr('\\','/').downcase
    if actual!=expected
      if attempt<60
        UI.start_timer(1,false){run(attempt+1)}
        return
      end
      raise 'HOLD_WRONG_ACTIVE_MODEL'
    end
    should_quit=true
    raise 'HOLD_MODEL_GUID' unless m.guid.to_s==EXPECTED_GUID
    raise 'HOLD_MODEL_MODIFIED' if m.modified?
    raise 'HOLD_MODEL_UNITS' unless m.options['UnitsOptions']['LengthUnit']==2
    roots=m.entities.grep(Sketchup::Face)
    raise "HOLD_ROOT_COUNT_#{roots.size}" unless roots.size==257
    selected=roots.select{|f|PIDS.include?(f.persistent_id)}.sort_by(&:persistent_id)
    raise 'HOLD_MISSING_FACE' unless selected.map(&:persistent_id)==PIDS.sort
    rows=selected.map do |f|
      loops=f.loops
      raise 'HOLD_MISSING_INNER_LOOP' unless loops.size==2 && loops.count(&:outer?)==1
      mesh=f.mesh(0)
      raw_polys=mesh.polygons.map{|poly|poly.map{|ind|mm(mesh.point_at(ind.to_i.abs))}}
      polys=raw_polys.select{|p|p.size==3 && area3(p)>0.01}
      raise "HOLD_BAD_NATIVE_POLYGONS_PID_#{f.persistent_id}_LEN_#{raw_polys.map(&:size).uniq.join(',')}" unless raw_polys.size.between?(1,200) && raw_polys.all?{|p|p.size==3} && polys.size>0
      native=(f.area.to_f*MM*MM).round(3)
      mesh_area=polys.sum{|p|area3(p)}
      raise "HOLD_NATIVE_MESH_AREA_#{f.persistent_id}_#{native}_#{mesh_area}" if (native-mesh_area).abs>[250,native*0.001].max
      {
        'face_pid'=>f.persistent_id,
        'outer_vertex_count'=>loops.find(&:outer?).vertices.size,
        'inner_vertex_count'=>loops.find{|l|!l.outer?}.vertices.size,
        'face_area_mm2'=>native,
        'mesh_area_mm2'=>mesh_area.round(3),
        'polygons_world_mm'=>polys,
        'triangle_count'=>polys.size,
        'degenerate_triangles_excluded'=>raw_polys.size-polys.size
      }
    end
    write_once(File.join(BASE,"SEED_SKP_01_FOUR_INNER_LOOP_NATIVE_MESH_V3_#{RUN}_20261118.json"),{
      'schema'=>'INTERIOR_SEED_SKP_01_FOUR_INNER_LOOP_FACE_MESH_NATIVE_V1',
      'status'=>'PASS_NATIVE_INNER_LOOP_FOUR_FACES__HOLD_RIGHTS_QTO',
      'at'=>Time.now.utc.iso8601,'run'=>RUN,
      'model_guid'=>m.guid.to_s,'source_is_qa_copy'=>true,
      'model_modified'=>m.modified?,'model_save_invoked'=>false,
      'root_direct_face_count'=>roots.size,
      'faces'=>rows,'rights_approved'=>false,'room_qto_approved'=>false,
      'production_publish_approved'=>false
    })
  rescue Exception=>e
    begin
      write_once(File.join(BASE,"SEED_SKP_01_FOUR_INNER_LOOP_NATIVE_ERROR_V3_#{RUN}_20261118.json"),{
        'status'=>'HOLD_FOUR_INNER_LOOP_NATIVE','error_type'=>e.class.to_s,
        'error'=>e.message.to_s[0,400]})
    rescue Exception
    end
  ensure
    if should_quit
      UI.start_timer(1,false) do
        begin
          cur=Sketchup.active_model
          Sketchup.quit if cur && cur.path.to_s.tr('\\','/').downcase==expected && !cur.modified?
        rescue Exception
        end
      end
    end
  end
end
Seed01FourHoleNativeV3.run
