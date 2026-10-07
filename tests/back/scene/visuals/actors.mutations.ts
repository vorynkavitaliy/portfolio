import type { ActorsCaseId } from '@tests/back/scene/visuals/actors.cases';

export type ActorsMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly ActorsCaseId[];
}>;

const MATH = 'src/scene/visuals/actors/actors-math.ts';
const CONSTANTS = 'src/scene/visuals/actors/actors.constants.ts';
const BOX = 'src/scene/visuals/actors/box-geometry.ts';
const BLOOM = 'src/scene/visuals/actors/bloom.ts';
const ACTORS = 'src/scene/visuals/actors/actors.ts';
const PLANE = 'src/scene/visuals/actors/plane.ts';
const BEAMS = 'src/scene/visuals/actors/beams.ts';
const LETTERS = 'src/scene/visuals/actors/letters.ts';
const LINK = 'src/scene/visuals/actors/link.ts';
const LANDMARKS = 'src/scene/visuals/actors/landmarks.ts';
const BURST = 'src/scene/visuals/actors/burst.ts';
const RING = 'src/scene/visuals/actors/ring.ts';

export const ACTORS_MUTATIONS: readonly ActorsMutation[] = [
  {
    id: 'letters.ease-linear',
    file: MATH,
    find: 'return 1 - Math.pow(1 - value, 3);',
    replace: 'return value;',
    caseIds: ['actors.letters.ease'],
  },
  {
    id: 'letters.settle-scaled',
    file: MATH,
    find: '(k - delay) / LETTER_SETTLE',
    replace: '(k - delay) * LETTER_SETTLE',
    caseIds: ['actors.letters.ease', 'actors.letters.matrix'],
  },
  {
    id: 'letters.start-scale',
    file: MATH,
    find: 'LETTER_START_SCALE + (1 - LETTER_START_SCALE) * t',
    replace: '1',
    caseIds: ['actors.letters.matrix'],
  },
  {
    id: 'letters.intro-reduced',
    file: MATH,
    find: 'done || reducedMotion ?',
    replace: 'done ?',
    caseIds: ['actors.letters.intro-k', 'actors.letters.module'],
  },
  {
    id: 'letters.bob-reduced',
    file: MATH,
    find: 'return reducedMotion ? baseY : baseY +',
    replace: 'return false ? baseY : baseY +',
    caseIds: ['actors.letters.bob', 'actors.letters.module'],
  },
  {
    id: 'letters.billboard-swapped',
    file: MATH,
    find: 'Math.atan2(toX - fromX, toZ - fromZ)',
    replace: 'Math.atan2(toZ - fromZ, toX - fromX)',
    caseIds: ['actors.letters.billboard', 'actors.letters.module'],
  },
  {
    id: 'letters.lift-dropped',
    file: LETTERS,
    find: '?? 0) + LETTER_LIFT;',
    replace: '?? 0);',
    caseIds: ['actors.letters.module'],
  },
  {
    id: 'letters.done-ignored',
    file: LETTERS,
    find: 'group.position.y = frame.intro.done',
    replace: 'group.position.y = false',
    caseIds: ['actors.letters.module'],
  },
  {
    id: 'beam.docked-by-target',
    file: MATH,
    find: 'if (index === dockedIndex) {',
    replace: 'if (index === autopilotIndex) {',
    caseIds: ['actors.beam.active', 'actors.beam.module'],
  },
  {
    id: 'beam.core-boost-dropped',
    file: MATH,
    find: 'return BEAM_CORE.base + active + boost;',
    replace: 'return BEAM_CORE.base + active;',
    caseIds: ['actors.beam.intensity', 'actors.beam.module'],
  },
  {
    id: 'beam.halo-boost-full',
    file: MATH,
    find: 'boost * BEAM_HALO.boostGain',
    replace: 'boost',
    caseIds: ['actors.beam.intensity', 'actors.beam.module'],
  },
  {
    id: 'beam.docked-level',
    file: CONSTANTS,
    find: 'BEAM_DOCKED_ACTIVE = 0.6',
    replace: 'BEAM_DOCKED_ACTIVE = 0.5',
    caseIds: ['actors.beam.active', 'actors.beam.module'],
  },
  {
    id: 'beam.halo-ignores-state',
    file: BEAMS,
    find: 'halo.intensity.setX(index, beamHaloIntensity(boost, active));',
    replace: 'halo.intensity.setX(index, beamCoreIntensity(boost, active));',
    caseIds: ['actors.beam.module'],
  },
  {
    id: 'beam.lift-dropped',
    file: BEAMS,
    find: '(stationTops[index * 3 + 1] ?? 0) + BEAM_CENTER_LIFT',
    replace: '(stationTops[index * 3 + 1] ?? 0)',
    caseIds: ['actors.beam.module'],
  },
  {
    id: 'ring.reduced-shown',
    file: MATH,
    find: 'if (reducedMotion || t >= 1) {',
    replace: 'if (t >= 1) {',
    caseIds: ['actors.ring.pose', 'actors.effects.module'],
  },
  {
    id: 'ring.no-fade',
    file: MATH,
    find: 'out.opacity = (1 - t) * RING.opacity;',
    replace: 'out.opacity = RING.opacity;',
    caseIds: ['actors.ring.pose', 'actors.effects.module'],
  },
  {
    id: 'ring.scale-linear',
    file: MATH,
    find: 'RING.baseScale + easeOut(clamp01(t)) * scale',
    replace: 'RING.baseScale + clamp01(t) * scale',
    caseIds: ['actors.ring.pose', 'actors.effects.module'],
  },
  {
    id: 'ring.position-dropped',
    file: RING,
    find: 'mesh.position.set(ring.x, ring.y, ring.z);',
    replace: 'mesh.position.set(ring.x, ring.y, 0);',
    caseIds: ['actors.effects.module'],
  },
  {
    id: 'burst.reduced-shown',
    file: MATH,
    find: 'return !reducedMotion && t < 1;',
    replace: 'return t < 1;',
    caseIds: ['actors.burst.visible', 'actors.effects.module'],
  },
  {
    id: 'burst.end-inclusive',
    file: MATH,
    find: 'return !reducedMotion && t < 1;',
    replace: 'return !reducedMotion && t <= 1;',
    caseIds: ['actors.burst.visible'],
  },
  {
    id: 'burst.scale-dropped',
    file: BURST,
    find: 'uniforms.uScale.value = frame.viewport.height;',
    replace: 'uniforms.uScale.value = frame.viewport.width;',
    caseIds: ['actors.effects.module'],
  },
  {
    id: 'plane.pitch-sign',
    file: MATH,
    find: 'out.rx = -plane.pitch;',
    replace: 'out.rx = plane.pitch;',
    caseIds: ['actors.plane.pose', 'actors.plane.module'],
  },
  {
    id: 'plane.prop-reduced',
    file: MATH,
    find: 'return reducedMotion\n    ? angle',
    replace: 'return false\n    ? angle',
    caseIds: ['actors.plane.prop', 'actors.plane.module'],
  },
  {
    id: 'plane.prop-speed',
    file: CONSTANTS,
    find: 'perSpeed: 2',
    replace: 'perSpeed: 3',
    caseIds: ['actors.plane.prop', 'actors.plane.module'],
  },
  {
    id: 'plane.strobe-window',
    file: CONSTANTS,
    find: 'on: 0.1',
    replace: 'on: 0.2',
    caseIds: ['actors.plane.strobe'],
  },
  {
    id: 'plane.strobe-reduced',
    file: MATH,
    find: 'return reducedMotion || time % STROBE.period',
    replace: 'return time % STROBE.period',
    caseIds: ['actors.plane.strobe', 'actors.plane.module'],
  },
  {
    id: 'plane.euler-order',
    file: PLANE,
    find: "group.rotation.order = 'YXZ';",
    replace: "group.rotation.order = 'XYZ';",
    caseIds: ['actors.plane.module'],
  },
  {
    id: 'plane.shared-material-split',
    file: PLANE,
    find: 'const prop = new Mesh(propGeometry, litMaterial);',
    replace:
      'const prop = new Mesh(propGeometry, new MeshLambertMaterial({ vertexColors: true }));',
    caseIds: ['actors.budget.plane'],
  },
  {
    id: 'mast.parity',
    file: MATH,
    find: 'Math.floor(time * MAST_BLINK_HZ) % 2 === 0',
    replace: 'Math.floor(time * MAST_BLINK_HZ) % 2 === 1',
    caseIds: ['actors.mast.blink'],
  },
  {
    id: 'mast.reduced-blinks',
    file: MATH,
    find: 'return reducedMotion || Math.floor',
    replace: 'return Math.floor',
    caseIds: ['actors.mast.reduced'],
  },
  {
    id: 'link.midpoint',
    file: MATH,
    find: 'out.my = from.y + dy / 2;',
    replace: 'out.my = from.y + dy;',
    caseIds: ['actors.link.segment', 'actors.link.module'],
  },
  {
    id: 'link.min-length',
    file: MATH,
    find: 'if (!(length >= LINK_MIN_LENGTH)) {',
    replace: 'if (length < 0) {',
    caseIds: ['actors.link.segment'],
  },
  {
    id: 'link.lift',
    file: CONSTANTS,
    find: 'LINK_LIFT = 3',
    replace: 'LINK_LIFT = 0',
    caseIds: ['actors.link.module'],
  },
  {
    id: 'link.pulse-wave',
    file: MATH,
    find: 'LINK_PULSE.amplitude * Math.sin(',
    replace: 'LINK_PULSE.amplitude * Math.cos(',
    caseIds: ['actors.link.packets'],
  },
  {
    id: 'link.packet-size',
    file: MATH,
    find: 'Math.sin(Math.PI * u)',
    replace: 'Math.sin(u)',
    caseIds: ['actors.link.packets'],
  },
  {
    id: 'link.always-visible',
    file: LINK,
    find: 'frame.dockedIndex >= 0 ? frame.stations[frame.dockedIndex] : undefined',
    replace: 'frame.stations[frame.dockedIndex < 0 ? 0 : frame.dockedIndex]',
    caseIds: ['actors.link.module'],
  },
  {
    id: 'ai.segment',
    file: MATH,
    find: 'return index % AI_PACKET.segments;',
    replace: 'return index;',
    caseIds: ['actors.ai.packets'],
  },
  {
    id: 'ai.rate',
    file: CONSTANTS,
    find: 'rate: 0.55',
    replace: 'rate: 0.5',
    caseIds: ['actors.ai.packets'],
  },
  {
    id: 'ai.time-unfrozen',
    file: LANDMARKS,
    find: 'const time = frame.reducedMotion ? 0 : frame.time;',
    replace: 'const time = frame.time;',
    caseIds: ['actors.ai.packets-reduced'],
  },
  {
    id: 'box.winding',
    file: BOX,
    find: '{ normal: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },',
    replace: '{ normal: [0, 0, 1], u: [0, 1, 0], v: [1, 0, 0] },',
    caseIds: ['actors.geometry.boxes'],
  },
  {
    id: 'box.half-size',
    file: BOX,
    find: 'component(part.size, axis) / 2',
    replace: 'component(part.size, axis)',
    caseIds: ['actors.geometry.boxes'],
  },
  {
    id: 'bloom.narrow-offered',
    file: ACTORS,
    find: "profile !== 'desktop'",
    replace: 'false',
    caseIds: ['actors.bloom.profile'],
  },
  {
    id: 'bloom.scene-replaced',
    file: BLOOM,
    find: 'new RenderPass(scene, camera)',
    replace: 'new RenderPass(scene.clone(), camera)',
    caseIds: ['actors.bloom.lifecycle'],
  },
  {
    id: 'bloom.render-pass-dropped',
    file: BLOOM,
    find: '  composer.addPass(renderPass);',
    replace: '',
    caseIds: ['actors.bloom.lifecycle'],
  },
  {
    id: 'bloom.composer-leaks',
    file: BLOOM,
    find: '    composer.dispose();',
    replace: '',
    caseIds: ['actors.bloom.lifecycle'],
  },
  {
    id: 'bloom.pass-leaks',
    file: BLOOM,
    find: '    bloomPass.dispose();',
    replace: '',
    caseIds: ['actors.bloom.lifecycle'],
  },
  {
    id: 'dispose.plane-geometry',
    file: PLANE,
    find: '    bodyGeometry.dispose();',
    replace: '',
    caseIds: ['actors.dispose'],
  },
  {
    id: 'dispose.beam-material',
    file: BEAMS,
    find: '      layer.material.dispose();',
    replace: '',
    caseIds: ['actors.dispose'],
  },
];
