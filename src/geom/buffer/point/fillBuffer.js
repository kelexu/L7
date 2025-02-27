import Global from '../../../global';
import * as THREE from '../../../core/three';
import * as polygonShape from '../../shape/polygon';
import * as polygonPath from '../../shape/path';
import Util from '../../../util';
const { pointShape } = Global;
export default function fillBuffer(layerData) {
  const attribute = {
    vertices: [],
    normals: [],
    colors: [],
    pickingIds: [],
    shapePositions: [],
    a_size: [],
    faceUv: []

  };
  layerData.forEach(item => {
    let { size, shape, color, id, coordinates } = item;
    let polygon = null;
    const path = polygonPath[shape]();
    if (pointShape['2d'].indexOf(shape) !== -1) {
      Util.isArray(size) || (size = [ size, size, 0 ]);
      polygon = polygonShape.fill([ path ]);
    } else if (pointShape['3d'].indexOf(shape) !== -1) {
      Util.isArray(size) || (size = [ size, size, size ]);
      polygon = polygonShape.extrude([ path ]);
    } else {
      throw new Error('Invalid shape type: ' + shape);
    }
    toPointShapeAttributes(polygon, coordinates, { size, shape, color, id }, attribute);
    // toPointShapeAttributes(polygon, null, {}, attribute);
    // instanced attributes
    // attribute.vertices.push(...coordinates);
    // attribute.a_size.push(...size);
    // attribute.colors.push(...color);
    // attribute.pickingIds.push(id);

  });
  return attribute;

}
function toPointShapeAttributes(polygon, geo, style, attribute) {
  const { positionsIndex, positions } = polygon;
  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const pC = new THREE.Vector3();

  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();
  for (let i = 0; i < positionsIndex.length / 3; i++) {
    let index = positionsIndex[i * 3];
    const { color, size, id } = style;
    const ax = positions[index][0];
    const ay = positions[index][1];
    const az = positions[index][2];
    index = positionsIndex[i * 3 + 1];
    const bx = positions[index][0];
    const by = positions[index][1];
    const bz = positions[index][2];
    index = positionsIndex[i * 3 + 2];
    const cx = positions[index][0];
    const cy = positions[index][1];
    const cz = positions[index][2];

    pA.set(ax, ay, az);
    pB.set(bx, by, bz);
    pC.set(cx, cy, cz);

    cb.subVectors(pC, pB);
    ab.subVectors(pA, pB);
    cb.cross(ab);

    cb.normalize();

    const nx = cb.x;
    const ny = cb.y;
    const nz = cb.z;

    attribute.vertices.push(...geo, ...geo, ...geo);
    attribute.shapePositions.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    attribute.a_size.push(...size, ...size, ...size);
    attribute.normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    attribute.colors.push(...color, ...color, ...color);
    attribute.pickingIds.push(id, id, id);

    // attribute.shapePositions.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    // attribute.normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);

  }
}
