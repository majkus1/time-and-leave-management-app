import { LANDING_ANNUAL_MONTHS_CHARGED, LANDING_TRIAL_DAYS, landingCoreTiers, landingModules, landingTrial } from '@/data/landingPlanPricing'

// Liczby Planopii do porównań — z katalogu cen (ten sam generat co cennik), żeby wpisy nie rozjechały się z cennikiem
export const TRIAL_DAYS = LANDING_TRIAL_DAYS
export const FREE_USERS = landingTrial.maxUsers
export const CORE_FROM = landingCoreTiers[0]
export const CORE_15 = landingCoreTiers.find(t => t.maxUsers === 15) ?? landingCoreTiers[1]
export const TIERS = landingCoreTiers.map(t => t.maxUsers)
export const MAX_TIER = Math.max(...TIERS)
export const ANNUAL_MONTHS = LANDING_ANNUAL_MONTHS_CHARGED
export const moduleNet = (id: (typeof landingModules)[number]['id']) => landingModules.find(m => m.id === id)?.monthlyNetPln ?? 0
export const pln = (n: number) => n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
/** Miesięczny koszt planu przy rozliczeniu rocznym (płacisz za ANNUAL_MONTHS miesięcy) */
export const annualMonthly = (monthlyNet: number) => (monthlyNet * ANNUAL_MONTHS) / 12
export const TIERS_LABEL = `progi do ${TIERS.slice(0, -1).join(', ')} i ${MAX_TIER} osób`
