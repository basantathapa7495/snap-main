// Use a deterministic, unique order in each caller so pages cannot overlap.
export async function loadAllRows<T>(query: (offset: number) => PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>): Promise<{ data: T[]; error: null }> {
  const data: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await query(offset);
    if (result.error) throw new Error(result.error.message);
    data.push(...result.data || []);
    if ((result.data || []).length < 1000) return { data, error: null };
  }
}
