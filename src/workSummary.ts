import type { HourlyRate, Report, Youth } from './types';
import { calculateAge } from './data';

export const MANDATORY_HOURS_LIMIT = 90;

// ממירה תאריך טקסטואלי לאובייקט Date מקומי כדי להשוות חודשים ומחזורי עבודה.
const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

// מחזירה את תחילת שנת העבודה הנוכחית, שתמיד מתחילה ב-1 ביולי.
export const getWorkCycleStart = (referenceDate = new Date()) => {
  const year = referenceDate.getMonth() >= 6 ? referenceDate.getFullYear() : referenceDate.getFullYear() - 1;
  return new Date(year, 6, 1);
};

// בודקת אם דיווח שייך לשנת העבודה הנוכחית שהתחילה ב-1 ביולי.
export const isReportInCurrentCycle = (reportDate: string, referenceDate = new Date()) =>
  parseLocalDate(reportDate).getTime() >= getWorkCycleStart(referenceDate).getTime();

// בודקת אם דיווח שייך לחודש הנוכחי.
const isSameMonth = (reportDate: string, referenceDate = new Date()) => {
  const date = parseLocalDate(reportDate);
  return date.getFullYear() === referenceDate.getFullYear() && date.getMonth() === referenceDate.getMonth();
};

// מחזירה את התעריף השעתי לפי גיל הנער.
const getYouthRate = (youth: Youth, rates: HourlyRate[]) => {
  const age = calculateAge(youth.birthDate);
  const matchedRate = rates.find((rate) => rate.age === age);
  return matchedRate?.rate ?? 0;
};

// ממיינת דיווחים לפי תאריך ושעת התחלה כדי לאפשר חישוב מצטבר יציב.
const sortReportsByDate = (reports: Report[]) =>
  reports
    .slice()
    .sort((left, right) => `${left.date}T${left.startTime}`.localeCompare(`${right.date}T${right.startTime}`));

// מחזירה את כל הדיווחים המאושרים או שכבר שולמו בתוך שנת העבודה הנוכחית.
const getCycleTrackedReports = (youthId: string, reports: Report[], referenceDate: Date) =>
  sortReportsByDate(
    reports.filter(
      (report) =>
        report.youthId === youthId &&
        (report.status === 'approved' || report.status === 'paid') &&
        isReportInCurrentCycle(report.date, referenceDate),
    ),
  );

export interface YouthWorkSummary {
  cycleApprovedHours: number;
  mandatoryCompletedHours: number;
  payableCumulativeHours: number;
  payablePendingHours: number;
  currentMonthHours: number;
  currentMonthPayableHours: number;
  payablePendingAmount: number;
  totalEarnedAmount: number;
  manualAdjustmentHours: number;
}

// בונה סיכום שעות ותשלום לנער, כשהחובה מתאפסת רק בתחילת יולי והתשלום מתאפס באיפוס החודשי.
export const buildYouthWorkSummary = (
  youth: Youth,
  reports: Report[],
  rates: HourlyRate[],
  referenceDate = new Date(),
): YouthWorkSummary => {
  const cycleTrackedReports = getCycleTrackedReports(youth.id, reports, referenceDate);
  const manualAdjustmentHours = Math.max(0, Number(youth.manualHoursAdjustment ?? 0));

  let cycleTrackedHours = 0;
  let currentMonthHours = 0;
  let currentMonthPayableHours = 0;
  let cumulativeCycleHours = manualAdjustmentHours;

  for (const report of cycleTrackedReports) {
    const payableBeforeReport = Math.max(0, cumulativeCycleHours - MANDATORY_HOURS_LIMIT);
    cumulativeCycleHours += report.totalHours;
    const payableAfterReport = Math.max(0, cumulativeCycleHours - MANDATORY_HOURS_LIMIT);

    cycleTrackedHours += report.totalHours;

    if (isSameMonth(report.date, referenceDate)) {
      currentMonthHours += report.totalHours;
      currentMonthPayableHours += payableAfterReport - payableBeforeReport;
    }
  }

  const effectiveCycleHours = cycleTrackedHours + manualAdjustmentHours;
  const payableCumulativeHours = Math.max(0, effectiveCycleHours - MANDATORY_HOURS_LIMIT);
  const payablePendingHours = Math.max(0, payableCumulativeHours - Number(youth.lastResetHours ?? 0));
  const hourlyRate = getYouthRate(youth, rates);

  return {
    cycleApprovedHours: effectiveCycleHours,
    mandatoryCompletedHours: Math.min(MANDATORY_HOURS_LIMIT, effectiveCycleHours),
    payableCumulativeHours,
    payablePendingHours,
    currentMonthHours,
    currentMonthPayableHours,
    payablePendingAmount: payablePendingHours * hourlyRate,
    totalEarnedAmount: payableCumulativeHours * hourlyRate,
    manualAdjustmentHours,
  };
};
