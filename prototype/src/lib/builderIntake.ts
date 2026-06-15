import type { LucideIcon } from 'lucide-react'
import {
  Landmark, HeartPulse, Building2, Ellipsis,
  ShieldAlert, Headphones, Banknote, UserPlus, HandCoins,
  CalendarCheck, Pill, ClipboardList, ReceiptText, Clock,
  Phone, BadgeCheck, FileText, TrendingUp, BarChart3,
} from 'lucide-react'

/* ── New-agent intake — the high-level questions BEFORE the chat ─────
   Industries mirror cartesia.ai's interactive panel (Finance /
   Healthcare / Government — the real GTM verticals), and each use-case
   list is lifted from Cartesia's own marketing: the homepage finance
   panel (fraud-detection, collections, account-opening, loan-assistance…)
   and the /industries/healthcare page (scheduling, refills, intake,
   billing, 24/7 answering). Government has no public page; that list is
   standard public-sector voice work.

   Labels are content keys; `seed` stays English — it is sent to the
   builder's LLM as the opening user turn, not rendered. */

export interface IntakeUseCase {
  id: string
  labelKey: string
  icon: LucideIcon
  seed: string
}

export interface IntakeIndustry {
  id: string
  labelKey: string
  subKey: string
  icon: LucideIcon
  useCases: IntakeUseCase[]
}

export const INDUSTRIES: IntakeIndustry[] = [
  {
    id: 'finance',
    labelKey: 'builder.intake.industry.finance',
    subKey: 'builder.intake.industry.finance.sub',
    icon: Landmark,
    useCases: [
      { id: 'fraud', labelKey: 'builder.intake.usecase.finance.fraud', icon: ShieldAlert, seed: 'A fraud-detection agent for a financial services company — outbound verification calls on suspicious transactions with step-up authentication. ' },
      { id: 'support', labelKey: 'builder.intake.usecase.finance.support', icon: Headphones, seed: 'A customer support line for a financial services company — account questions, card issues, and branch info. ' },
      { id: 'collections', labelKey: 'builder.intake.usecase.finance.collections', icon: Banknote, seed: 'A collections agent for a financial services company — payment reminders and arranging payment plans. ' },
      { id: 'account', labelKey: 'builder.intake.usecase.finance.account', icon: UserPlus, seed: 'An account-opening assistant for a financial services company — guiding applicants and collecting the basics. ' },
      { id: 'loan', labelKey: 'builder.intake.usecase.finance.loan', icon: HandCoins, seed: 'A loan-assistance agent for a financial services company — application status, required documents, and next steps. ' },
    ],
  },
  {
    id: 'healthcare',
    labelKey: 'builder.intake.industry.healthcare',
    subKey: 'builder.intake.industry.healthcare.sub',
    icon: HeartPulse,
    useCases: [
      { id: 'scheduling', labelKey: 'builder.intake.usecase.healthcare.scheduling', icon: CalendarCheck, seed: 'An appointment agent for a healthcare clinic — scheduling, rescheduling, and confirmation calls. ' },
      { id: 'refills', labelKey: 'builder.intake.usecase.healthcare.refills', icon: Pill, seed: 'A prescription-refill line for a healthcare clinic — taking refill requests and routing them to the pharmacy team. ' },
      { id: 'intake', labelKey: 'builder.intake.usecase.healthcare.intake', icon: ClipboardList, seed: 'A patient-intake agent for a healthcare clinic — gathering history and concerns before appointments. ' },
      { id: 'billing', labelKey: 'builder.intake.usecase.healthcare.billing', icon: ReceiptText, seed: 'A billing and benefits line for a healthcare clinic — answering coverage, claims, and eligibility questions. ' },
      { id: 'afterhours', labelKey: 'builder.intake.usecase.healthcare.afterhours', icon: Clock, seed: 'An after-hours answering service for a healthcare clinic — triaging calls and taking messages around the clock. ' },
    ],
  },
  {
    id: 'government',
    labelKey: 'builder.intake.industry.government',
    subKey: 'builder.intake.industry.government.sub',
    icon: Building2,
    useCases: [
      { id: 'citizen', labelKey: 'builder.intake.usecase.government.citizen', icon: Phone, seed: 'A citizen-services line for a government office — answering common questions and routing residents to the right department. ' },
      { id: 'benefits', labelKey: 'builder.intake.usecase.government.benefits', icon: BadgeCheck, seed: 'A benefits-inquiry agent for a government office — eligibility questions and application status. ' },
      { id: 'permits', labelKey: 'builder.intake.usecase.government.permits', icon: CalendarCheck, seed: 'An appointments and permits line for a government office — booking visits and explaining requirements. ' },
      { id: 'forms', labelKey: 'builder.intake.usecase.government.forms', icon: FileText, seed: 'A form-assistance agent for a government office — helping residents complete applications correctly. ' },
    ],
  },
  {
    id: 'other',
    labelKey: 'builder.intake.industry.other',
    subKey: 'builder.intake.industry.other.sub',
    icon: Ellipsis,
    useCases: [
      { id: 'support', labelKey: 'builder.intake.usecase.generic.support', icon: Headphones, seed: 'An inbound customer support line for my business. ' },
      { id: 'scheduling', labelKey: 'builder.intake.usecase.generic.scheduling', icon: CalendarCheck, seed: 'An appointment scheduling agent for my business. ' },
      { id: 'sales', labelKey: 'builder.intake.usecase.generic.sales', icon: TrendingUp, seed: 'An outbound sales follow-up agent for my business. ' },
      { id: 'survey', labelKey: 'builder.intake.usecase.generic.survey', icon: BarChart3, seed: 'An outbound customer-survey caller for my business. ' },
    ],
  },
]

/* The dashed "Something else" row at the end of every use-case list —
   names the industry, lets the conversation discover the job. */
export function otherUseCaseSeed(industryId: string): string {
  const noun: Record<string, string> = {
    finance: 'a financial services company',
    healthcare: 'a healthcare clinic',
    government: 'a government office',
    other: 'my business',
  }
  return `A voice agent for ${noun[industryId] ?? 'my business'}. `
}
