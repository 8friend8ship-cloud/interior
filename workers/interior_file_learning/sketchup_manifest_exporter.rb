# frozen_string_literal: true
# CentralAgent SketchUp manifest exporter.
# Run inside SketchUp Ruby. Exports structure through the supported Ruby API;
# it does not decode the proprietary .skp binary container.
require 'json'

module CentralAgent
  module InteriorManifest
    module_function

    def point_mm(point)
      [point.x.to_mm, point.y.to_mm, point.z.to_mm]
    end

    def bounds_hash(bounds)
      {
        min_mm: point_mm(bounds.min),
        max_mm: point_mm(bounds.max),
        width_mm: bounds.width.to_mm,
        height_mm: bounds.height.to_mm,
        depth_mm: bounds.depth.to_mm
      }
    end

    def material_hash(material)
      {
        name: material.name,
        display_name: material.display_name,
        alpha: material.alpha,
        color: material.color ? material.color.to_a : nil,
        texture_filename: material.texture ? material.texture.filename : nil
      }
    end

    def definition_hash(definition)
      {
        name: definition.name,
        description: definition.description,
        instance_count: definition.instances.length,
        bounds: bounds_hash(definition.bounds),
        entity_count: definition.entities.length
      }
    end

    def scene_hash(page)
      camera = page.camera
      {
        name: page.name,
        camera: {
          eye_mm: point_mm(camera.eye),
          target_mm: point_mm(camera.target),
          up: [camera.up.x, camera.up.y, camera.up.z],
          perspective: camera.perspective?,
          fov: camera.fov
        }
      }
    end

    def export(path = nil)
      model = Sketchup.active_model
      payload = {
        schema: 'CENTRAL_SKP_MANIFEST_V2',
        model_path: model.path,
        title: model.title,
        units_options: model.options['UnitsOptions'].to_h,
        model_bounds: bounds_hash(model.bounds),
        entities: {
          root_count: model.entities.length,
          edges: model.entities.grep(Sketchup::Edge).length,
          faces: model.entities.grep(Sketchup::Face).length,
          groups: model.entities.grep(Sketchup::Group).length,
          component_instances: model.entities.grep(Sketchup::ComponentInstance).length
        },
        component_definitions: model.definitions.reject(&:image?).map { |d| definition_hash(d) },
        materials: model.materials.map { |m| material_hash(m) },
        tags: model.layers.map { |layer| { name: layer.name, visible: layer.visible? } },
        scenes: model.pages.map { |page| scene_hash(page) },
        active_camera: {
          eye_mm: point_mm(model.active_view.camera.eye),
          target_mm: point_mm(model.active_view.camera.target),
          up: [model.active_view.camera.up.x, model.active_view.camera.up.y, model.active_view.camera.up.z]
        }
      }
      output = path || File.join(File.dirname(model.path), "#{File.basename(model.path, '.skp')}.central_manifest.json")
      File.write(output, JSON.pretty_generate(payload))
      output
    end
  end
end
