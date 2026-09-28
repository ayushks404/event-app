// escape LIKE wildcards; ILIKE's default escape character is backslash
export const likePattern = (q?: string | null) => {
  const s = q?.trim();
  return s ? `%${s.replace(/[\\%_]/g, '\\$&')}%` : null;
};
