export type TransformWatch = Readonly<{
  writes: () => number;
  reset: () => void;
  restore: () => void;
}>;

export const watchTransforms = (elements: readonly HTMLElement[]): TransformWatch => {
  let count = 0;

  for (const element of elements) {
    const original: CSSStyleDeclaration = element.style;

    const watched: CSSStyleDeclaration = new Proxy(original, {
      get: (target, property) => {
        const value: unknown = Reflect.get(target, property);

        return typeof value === 'function' ? value.bind(target) : value;
      },
      set: (target, property, value) => {
        if (property === 'transform') {
          count += 1;
        }

        return Reflect.set(target, property, value);
      },
    });

    Object.defineProperty(element, 'style', { value: watched, configurable: true });
  }

  return {
    writes: () => {
      return count;
    },
    reset: () => {
      count = 0;
    },
    restore: () => {
      for (const element of elements) {
        Reflect.deleteProperty(element, 'style');
      }
    },
  };
};
