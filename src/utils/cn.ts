type ClassValue = string | number | null | undefined | false | ClassValue[];

/** Minimal className joiner — keeps Tailwind class lists readable. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  const walk = (value: ClassValue) => {
    if (!value && value !== 0) return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    out.push(String(value));
  };
  values.forEach(walk);
  return out.join(' ');
}
