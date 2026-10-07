export const fillTemplate = (
  template: string,
  values: Readonly<Record<string, string | number>>,
): string => {
  return template.replace(/\{([^{}]+)\}/g, (match: string, key: string) => {
    const value: string | number | undefined = Object.hasOwn(values, key) ? values[key] : undefined;

    return value === undefined ? match : String(value);
  });
};
