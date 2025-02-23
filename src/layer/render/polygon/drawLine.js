import * as THREE from '../../../core/three';
import { getBuffer } from '../../../geom/buffer/';
import { LineMaterial } from '../../../geom/material/lineMaterial';
export default function DrawPolygonLine(layerData, layer, buffer) {
  const style = layer.get('styleOptions');
  const activeOption = layer.get('activedOptions');
  const config = {
    ...style,
    activeColor: activeOption.fill
  };
  const { opacity } = config;
  if (!buffer) {
    const geometryBuffer = getBuffer(layer.type, layer.shape);
    buffer = new geometryBuffer({
      layerData
    });

  }
  const { attributes, indexArray } = buffer;
  const geometry = new THREE.BufferGeometry();
  if (indexArray) {
    geometry.setIndex(new THREE.Uint32BufferAttribute(indexArray, 1));
  }
  geometry.addAttribute('position', new THREE.Float32BufferAttribute(attributes.positions, 3));
  geometry.addAttribute('a_color', new THREE.Float32BufferAttribute(attributes.colors, 4));
  geometry.addAttribute('pickingId', new THREE.Float32BufferAttribute(attributes.pickingIds, 1));
  const lineMaterial = new LineMaterial({
    u_opacity: opacity
  }, {
    SHAPE: false
  });
  const polygonLineMesh = new THREE.LineSegments(geometry, lineMaterial);
  return polygonLineMesh;
}
