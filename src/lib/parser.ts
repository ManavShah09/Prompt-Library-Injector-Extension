/**
 * Extracts unique variable names from a prompt template.
 * Looks for {{variable_name}} placeholders.
 *
 * @example
 * extractVariables("Hello {{name}}, your role is {{role}}.")
 * // → ["name", "role"]
 */
export function extractVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const vars  = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    vars.add(match[1]);
  }
  return Array.from(vars);
}

/**
 * Replaces all {{variable}} placeholders with user-supplied values.
 * If a variable has no value, it is left as-is.
 *
 * @example
 * compilePrompt("Hello {{name}}!", { name: "World" })
 * // → "Hello World!"
 */
export function compilePrompt(
  content: string,
  vars: Record<string, string>
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    key in vars ? vars[key] : `{{${key}}}`
  );
}
