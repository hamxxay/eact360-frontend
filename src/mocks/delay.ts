/** Resolve sample data after a short delay so loading states are exercised in development. */
export const sampleDelay = <T,>(data: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(data), ms));
