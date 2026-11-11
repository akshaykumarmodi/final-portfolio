import * as THREE from "three";

/**
 * Builds a chrome ribbon: an elliptical cross-section swept along a closed curve,
 * twisting as it travels. Generated once; motion comes from group transforms.
 */
export function createRibbonGeometry(
  points: THREE.Vector3[],
  { width = 0.3, thickness = 0.035, segments = 360, radial = 14, twist = 2 } = {},
) {
  const curve = new THREE.CatmullRomCurve3(points, true, "centripetal");
  const frames = curve.computeFrenetFrames(segments, true);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const a = width / 2;
  const b = thickness / 2;
  const p = new THREE.Vector3();
  const W = new THREE.Vector3();
  const N = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const nrm = new THREE.Vector3();

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    curve.getPointAt(u, p);
    const k = i % segments;
    const ang = u * Math.PI * 2 * twist * 0.5 + Math.sin(u * Math.PI * 4) * 0.35;
    // Width direction rotates around the tangent for a twisting ribbon.
    W.copy(frames.binormals[k]!).multiplyScalar(Math.cos(ang)).addScaledVector(frames.normals[k]!, Math.sin(ang));
    N.crossVectors(frames.tangents[k]!, W).normalize();
    // Ribbon narrows slightly in places, for a hand-sculpted feel.
    const taper = 0.82 + 0.18 * Math.sin(u * Math.PI * 6 + 1.2);
    for (let j = 0; j <= radial; j++) {
      const th = (j / radial) * Math.PI * 2;
      const c = Math.cos(th);
      const s = Math.sin(th);
      pos.copy(p).addScaledVector(W, c * a * taper).addScaledVector(N, s * b);
      nrm.copy(W).multiplyScalar(c * b).addScaledVector(N, s * a * taper).normalize();
      positions.push(pos.x, pos.y, pos.z);
      normals.push(nrm.x, nrm.y, nrm.z);
      uvs.push(u, j / radial);
    }
  }
  const row = radial + 1;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a0 = i * row + j;
      const b0 = (i + 1) * row + j;
      indices.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  return g;
}

/**
 * Unit-space path (1 unit = half the portrait width, origin = portrait centre): two crossing,
 * tilted windings around the torso, so one band crosses the chest and the other rises up the right side.
 */
export function heroRibbonPath(samples = 28): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * Math.PI * 4;
    const r = 0.98 + 0.08 * Math.cos(t / 2);
    const x = r * Math.cos(t);
    const z = 0.8 * Math.sin(t);
    const y = -0.3 + 0.52 * Math.cos(t) * Math.cos(t / 2) + 0.18 * Math.sin(t / 2);
    pts.push([x, y, z]);
  }
  return pts;
}
