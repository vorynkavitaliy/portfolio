import type { WorldStoreCaseId } from '@tests/back/core/world/world-store.cases';

export type WorldStoreMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly WorldStoreCaseId[];
}>;

const STORE = 'src/core/world/world-store.ts';

export const WORLD_STORE_MUTATIONS: readonly WorldStoreMutation[] = [
  {
    id: 'initial.visited-prefilled',
    file: STORE,
    find: '  visited: [],',
    replace: "  visited: ['home-base'],",
    caseIds: ['world.store.initial.visited-empty'],
  },
  {
    id: 'initial.sound-on',
    file: STORE,
    find: '  sound: false,',
    replace: '  sound: true,',
    caseIds: ['world.store.initial.sound-off'],
  },
  {
    id: 'seed.ignored',
    file: STORE,
    find: 'let snapshot: WorldSnapshot = initial;',
    replace: 'let snapshot: WorldSnapshot = { ...initial };',
    caseIds: ['world.store.initial.seed'],
  },
  {
    id: 'snapshot.copied',
    file: STORE,
    find: '      return snapshot;\n    },\n    subscribe,',
    replace: '      return { ...snapshot };\n    },\n    subscribe,',
    caseIds: ['world.store.snapshot-stable'],
  },
  {
    id: 'notify.before-assign',
    file: STORE,
    find: '    snapshot = next;\n\n    for (const listener of [...listeners]) {\n      listener();\n    }',
    replace:
      '    for (const listener of [...listeners]) {\n      listener();\n    }\n\n    snapshot = next;',
    caseIds: ['world.store.notify-sync'],
  },
  {
    id: 'notify.deferred',
    file: STORE,
    find: '      listener();\n',
    replace: '      queueMicrotask(listener);\n',
    caseIds: ['world.store.notify-sync', 'world.store.listener-order'],
  },
  {
    id: 'notify.same-object',
    file: STORE,
    find: '    if (next === snapshot) {\n      return;\n    }\n',
    replace: '',
    caseIds: ['world.store.same-object-silent'],
  },
  {
    id: 'notify.twice',
    file: STORE,
    find: '    for (const listener of [...listeners]) {\n      listener();\n    }',
    replace:
      '    for (const listener of [...listeners]) {\n      listener();\n      listener();\n    }',
    caseIds: ['world.store.new-object-notifies-once'],
  },
  {
    id: 'notify.reversed',
    file: STORE,
    find: 'for (const listener of [...listeners])',
    replace: 'for (const listener of [...listeners].reverse())',
    caseIds: ['world.store.listener-order'],
  },
  {
    id: 'unsubscribe.noop',
    file: STORE,
    find: '      listeners.delete(listener);\n',
    replace: '',
    caseIds: ['world.store.unsubscribe'],
  },
  {
    id: 'dispatch.always-true-without-controller',
    file: STORE,
    find: '    if (activeController === null) {\n      return false;\n    }',
    replace: '    if (activeController === null) {\n      return true;\n    }',
    caseIds: ['world.store.dispatch-no-controller'],
  },
  {
    id: 'dispatch.false-with-controller',
    file: STORE,
    find: '    activeController.handle(command);\n\n    return true;',
    replace: '    activeController.handle(command);\n\n    return false;',
    caseIds: ['world.store.dispatch-controller'],
  },
  {
    id: 'dispatch.drops-command',
    file: STORE,
    find: '    activeController.handle(command);\n',
    replace: '',
    caseIds: ['world.store.dispatch-controller'],
  },
  {
    id: 'controller.not-stored',
    file: STORE,
    find: '      activeController = controller;\n',
    replace: '',
    caseIds: ['world.store.controller-cleared', 'world.store.dispatch-controller'],
  },
  {
    id: 'controller.getter-always-null',
    file: STORE,
    find: '    controller: () => {\n      return activeController;',
    replace: '    controller: () => {\n      return null;',
    caseIds: ['world.store.controller-cleared'],
  },
  {
    id: 'state.module-level',
    file: STORE,
    find: '  const listeners = new Set<() => void>();',
    replace: '  const listeners: Set<() => void> = ((globalThis as any).__wl ??= new Set());',
    caseIds: ['world.store.isolated'],
  },
];
