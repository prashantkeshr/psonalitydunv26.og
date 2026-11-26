import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { prefersReducedMotion } from '../lib/motion';

type V3 = [number, number, number];

/** A standing figure, in metres (feet at y = 0). */
const J = {
  head: [0, 1.62, 0] as V3,
  neckTop: [0, 1.53, 0] as V3,
  neck: [0, 1.46, 0] as V3,
  lSh: [-0.2, 1.42, 0] as V3,
  rSh: [0.2, 1.42, 0] as V3,
  lEl: [-0.29, 1.13, 0.02] as V3,
  rEl: [0.29, 1.13, 0.02] as V3,
  lWr: [-0.33, 0.86, 0.06] as V3,
  rWr: [0.33, 0.86, 0.06] as V3,
  lHa: [-0.345, 0.75, 0.075] as V3,
  rHa: [0.345, 0.75, 0.075] as V3,
  pelvis: [0, 0.97, 0] as V3,
  lHip: [-0.11, 0.95, 0] as V3,
  rHip: [0.11, 0.95, 0] as V3,
  lKn: [-0.12, 0.52, 0.02] as V3,
  rKn: [0.12, 0.52, 0.02] as V3,
  lAn: [-0.125, 0.1, 0] as V3,
  rAn: [0.125, 0.1, 0] as V3,
  lTo: [-0.13, 0.03, 0.13] as V3,
  rTo: [0.13, 0.03, 0.13] as V3,
};

const BONES: [keyof typeof J, keyof typeof J][] = [
  ['head', 'neck'], ['neck', 'lSh'], ['neck', 'rSh'], ['lSh', 'lEl'], ['lEl', 'lWr'], ['rSh', 'rEl'],
  ['rEl', 'rWr'], ['neck', 'pelvis'], ['pelvis', 'lHip'], ['pelvis', 'rHip'], ['lHip', 'lKn'],
  ['lKn', 'lAn'], ['rHip', 'rKn'], ['rKn', 'rAn'], ['lAn', 'lTo'], ['rAn', 'rTo'], ['lSh', 'lHip'], ['rSh', 'rHip'],
];

// Deterministic randomness so the figure looks the same on every visit.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function buildCloud(): { pos: Float32Array; rand: Float32Array } {
  const r = rng(7);
  const pts: number[] = [];
  const density = 7200; // points per square metre
  const v = new THREE.Vector3();

  const capsule = (a: V3, b: V3, ra: number, rb: number) => {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const axis = B.clone().sub(A);
    const len = axis.length();
    axis.normalize();
    const u = new THREE.Vector3(0, 0, 1).cross(axis);
    if (u.lengthSq() < 1e-4) u.set(1, 0, 0);
    u.normalize();
    const w = axis.clone().cross(u).normalize();
    const n = Math.round(density * len * Math.PI * (ra + rb));
    for (let i = 0; i < n; i++) {
      const t = r();
      const th = r() * Math.PI * 2;
      const rad = ra + (rb - ra) * t;
      v.copy(A).addScaledVector(axis, len * t).addScaledVector(u, Math.cos(th) * rad).addScaledVector(w, Math.sin(th) * rad);
      pts.push(v.x, v.y, v.z);
    }
  };

  const ellipsoid = (c: V3, rx: number, ry: number, rz: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const z = r() * 2 - 1;
      const th = r() * Math.PI * 2;
      const s = Math.sqrt(1 - z * z);
      pts.push(c[0] + rx * s * Math.cos(th), c[1] + ry * z, c[2] + rz * s * Math.sin(th));
    }
  };

  // Torso: stacked ellipses from hips to shoulders.
  const torso: [number, number][] = [[0.92, 0.165], [1.0, 0.16], [1.1, 0.14], [1.22, 0.16], [1.32, 0.185], [1.4, 0.19], [1.45, 0.12]];
  for (let k = 0; k < torso.length - 1; k++) {
    const [y0, x0] = torso[k];
    const [y1, x1] = torso[k + 1];
    const n = Math.round(density * (y1 - y0) * Math.PI * (x0 + x1) * 0.85);
    for (let i = 0; i < n; i++) {
      const t = r();
      const rx = x0 + (x1 - x0) * t;
      const th = r() * Math.PI * 2;
      pts.push(Math.cos(th) * rx, y0 + (y1 - y0) * t, Math.sin(th) * rx * 0.62);
    }
  }
  // Head (denser, like a face mesh) and neck.
  ellipsoid(J.head, 0.095, 0.118, 0.105, 2600);
  capsule(J.neck, J.neckTop, 0.05, 0.048);
  // Limbs.
  for (const s of ['l', 'r'] as const) {
    capsule(J[`${s}Sh`], J[`${s}El`], 0.055, 0.044);
    capsule(J[`${s}El`], J[`${s}Wr`], 0.044, 0.033);
    capsule(J[`${s}Wr`], J[`${s}Ha`], 0.034, 0.028);
    capsule(J[`${s}Hip`], J[`${s}Kn`], 0.088, 0.058);
    capsule(J[`${s}Kn`], J[`${s}An`], 0.056, 0.038);
    capsule(J[`${s}An`], J[`${s}To`], 0.04, 0.034);
    ellipsoid(J[`${s}Sh`], 0.06, 0.055, 0.055, 260);
  }
  const pos = new Float32Array(pts);
  const rand = new Float32Array(pos.length / 3).map(() => r());
  return { pos, rand };
}

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uBeam;
  uniform float uSize;
  uniform float uPR;
  attribute float aRand;
  varying float vGlow;
  varying float vY;
  varying float vRand;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.9 + aRand * 6.283) * 0.0018;
    p.z += cos(uTime * 0.7 + aRand * 6.283) * 0.0018;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float d = position.y - uBeam;
    vGlow = exp(-d * d * 260.0);
    vY = clamp(position.y / 1.75, 0.0, 1.0);
    vRand = aRand;
    gl_PointSize = uSize * uPR * (0.55 + aRand * 0.6 + vGlow * 1.6) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform float uTime;
  varying float vGlow;
  varying float vY;
  varying float vRand;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    float a = smoothstep(0.5, 0.0, r);
    vec3 magenta = vec3(0.88, 0.29, 0.84);
    vec3 iris = vec3(0.49, 0.36, 1.0);
    vec3 cyan = vec3(0.16, 0.85, 0.95);
    vec3 col = vY < 0.5 ? mix(magenta, iris, vY * 2.0) : mix(iris, cyan, (vY - 0.5) * 2.0);
    col = mix(col, vec3(1.0), vGlow * 0.75);
    float twinkle = 0.75 + 0.25 * sin(uTime * 2.0 + vRand * 40.0);
    gl_FragColor = vec4(col, a * (0.32 + vGlow * 0.68) * twinkle);
  }
`;

/** The hero's "digital human": a point cloud the scan beam sweeps through,
 *  with its skeleton and joints traced on top. Turns slowly and follows the
 *  pointer. Still when the visitor prefers less motion. */
export default function HeroFigure({ className = '' }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const still = prefersReducedMotion();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      el.dataset.fallback = 'true';
      return;
    }
    const pr = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pr);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
    camera.position.set(0, 1.0, 4.9);
    camera.lookAt(0, 0.9, 0);

    const figure = new THREE.Group();
    scene.add(figure);

    // Point cloud.
    const { pos, rand } = buildCloud();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
    const uniforms = {
      uTime: { value: 0 },
      uBeam: { value: 1.6 },
      uSize: { value: 22 },
      uPR: { value: pr },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    figure.add(new THREE.Points(geo, mat));

    // Skeleton and joints.
    const bonePts: number[] = [];
    for (const [a, b] of BONES) bonePts.push(...J[a], ...J[b]);
    const bones = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(bonePts, 3)),
      new THREE.LineBasicMaterial({ color: 0xb8c4ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending }),
    );
    figure.add(bones);
    const jointPts = Object.values(J).flat();
    const joints = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(jointPts, 3)),
      new THREE.PointsMaterial({ color: 0x8cebfa, size: 0.028, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }),
    );
    figure.add(joints);

    // Scan ring that rides with the beam.
    const ringGeo = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 97 }, (_, i) => {
        const a = (i / 96) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * 0.46, 0, Math.sin(a) * 0.3);
      }),
    );
    const ring = new THREE.Line(
      ringGeo,
      new THREE.LineBasicMaterial({ color: 0x8cebfa, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending }),
    );
    scene.add(ring);

    // Floor: concentric rings.
    const floor = new THREE.Group();
    for (const [rad, op] of [[0.5, 0.35], [0.8, 0.2], [1.15, 0.1]] as const) {
      const g = new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 129 }, (_, i) => {
          const a = (i / 128) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(a) * rad, 0, Math.sin(a) * rad);
        }),
      );
      floor.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x7c5cff, transparent: true, opacity: op })));
    }
    scene.add(floor);

    const size = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      // Narrow screens: step back so the whole figure fits.
      camera.position.z = w / h < 0.6 ? 5.9 : w / h < 0.75 ? 5.3 : 4.7;
      camera.updateProjectionMatrix();
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    const clock = new THREE.Clock();
    let raf = 0;
    const render = () => {
      const t = clock.getElapsedTime();
      uniforms.uTime.value = t;
      const beam = 0.92 + 0.86 * Math.sin(t * 0.9);
      uniforms.uBeam.value = beam;
      ring.position.y = beam;
      (ring.material as THREE.LineBasicMaterial).opacity = 0.25 + 0.35 * Math.abs(Math.cos(t * 0.9));
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      figure.rotation.y = t * 0.22 + pointer.x * 0.5;
      figure.rotation.x = pointer.y * 0.06;
      floor.rotation.y = -t * 0.1;
      renderer.render(scene, camera);
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (visible && !document.hidden) render();
    };
    if (still) {
      figure.rotation.y = -0.35;
      uniforms.uBeam.value = 1.6;
      ring.position.y = 1.6;
      renderer.render(scene, camera);
    } else {
      loop();
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mm = m.material as THREE.Material | undefined;
        mm?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className={`relative h-full w-full ${className}`} aria-hidden="true" />;
}
