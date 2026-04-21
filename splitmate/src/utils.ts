export const fmt = (n: number) => 'Rp ' + Number(n).toLocaleString('id-ID');

export const fmtK = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}jt`
  : n >= 1_000 ? `${(n / 1_000).toFixed(0)}rb`
  : String(n);

export const memberColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];
