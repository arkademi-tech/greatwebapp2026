export const fmt = (n: number) =>
  'Rp ' + Math.round(n).toLocaleString('id-ID')

export const fmtK = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}jt`
  : n >= 1_000   ? `${(n / 1_000).toFixed(0)}rb`
  : String(Math.round(n))

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

export const fmtDateShort = (d: string) => d.slice(5).replace('-', '/')

export const currentPeriod = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const periodLabel = (p: string) => {
  const [y, m] = p.split('-')
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']
  return `${months[parseInt(m) - 1]} ${y}`
}

/** Simplified debt algorithm — minimises number of transfers */
export interface SettlementTx {
  from: string
  to: string
  amount: number
}

export function calculateSettlements(
  balances: Record<string, number>
): SettlementTx[] {
  const b = { ...balances }
  const txs: SettlementTx[] = []

  for (let i = 0; i < 50; i++) {
    const creditor = Object.keys(b).reduce((a, k) => (b[k] > b[a] ? k : a))
    const debtor   = Object.keys(b).reduce((a, k) => (b[k] < b[a] ? k : a))
    if (b[creditor] < 1) break
    const amt = Math.min(b[creditor], -b[debtor])
    txs.push({ from: debtor, to: creditor, amount: Math.round(amt) })
    b[creditor] -= amt
    b[debtor]   += amt
  }

  return txs
}
