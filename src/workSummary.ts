import type { HourlyRate, Report, Youth } from './types';
import { calculateAge } from './data';

export const MANDATORY_HOURS_LIMIT = 90;

const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

export const getWorkCycleStart = (referenceDate = new Date()) => {
  const year = referenceDate.getMonth() >= 6 ? referenceDate.getFullYear() : referenceDate.getFullYear() - 1;
  return new Date(year, 6, 1);
};

export const isReportInCurrentCycle = (reportDate: string, referenceDate = new Date()) =>
  parseLocalDate(reportDate).getTime() >= getWorkCycleStart(referenceDate).getTime();

const isSameMonth = (reportDate: string, referenceDate = new Date()) => {
  const date = parseLocalDate(reportDate);
  return date.getFullYear() === referenceDate.getFullYear() && date.getMonth() === referenceDate.getMonth();
};

const getYouthRate = (youth: Youth, rates: HourlyRate[]) => {
  const age = calculateAge(youth.birthDate);
  const matchedRate = rates.find((rate) => rate.age === age);
  return matchedRate?.rate ?? 0;
};

export interface YouthWorkSummary {
  cycleApprovedHours: number;
  mandatoryCompletedHours: number;
  payableCumulativeHours: number;
  payablePendingHours: number;
  currentMonthHours: number;
  payablePendingAmount: number;
  totalEarnedAmount: number;
  manualAdjustmentHours: number;
}

export const buildYouthWorkSummary = (
  youth: Youth,
  reports: Report[],
  rates: HourlyRate[],
  referenceDate = new Date(),
): YouthWorkSummary => {
  // כאן הקסם: אנחנו מסננים רק דיווחים שהם 'approved'.
  // ברגע שנשנה סטטוס ל-'paid', הם יסוננו החוצה אוטומטית.
  const approvedReports = reports
    .filter((report) => report.youthId === youth.id && report.status === 'approved')
    .slice()
    .sort((left, right) => {
      const leftKey = `${left.date}T${left.startTime}`;
      const rightKey = `${right.date}T${right.startTime}`;
      return leftKey.localeCompare(rightKey);
    });

  let cycleApprovedHours = 0;
  let mandatoryCompletedHours = 0;
  let currentMonthHours = 0;

  for (const report of approvedReports) {
    if (!isReportInCurrentCycle(report.date, referenceDate)) {
      continue;
    }

    cycleApprovedHours += report.totalHours;

    const mandatoryHoursForReport = Math.max(
      0,
      Math.min(MANDATORY_HOURS_LIMIT - mandatoryCompletedHours, report.totalHours),
    );

    mandatoryCompletedHours += mandatoryHoursForReport;

    if (isSameMonth(report.date, referenceDate)) {
      currentMonthHours += report.totalHours;
    }
  }

  const manualAdjustmentHours = Number(youth.manualHoursAdjustment ?? 0);
  const payableHoursFromReports = Math.max(0, cycleApprovedHours - MANDATORY_HOURS_LIMIT);
  const payableCumulativeHours = Math.max(0, payableHoursFromReports + manualAdjustmentHours);
  const payablePendingHours = Math.max(0, payableCumulativeHours - Number(youth.lastResetHours ?? 0));
  const hourlyRate = getYouthRate(youth, rates);

  return {
    cycleApprovedHours,
    mandatoryCompletedHours: Math.min(MANDATORY_HOURS_LIMIT, cycleApprovedHours),
    payableCumulativeHours,
    payablePendingHours,
    currentMonthHours,
    payablePendingAmount: payablePendingHours * hourlyRate,
    totalEarnedAmount: payableCumulativeHours * hourlyRate,
    manualAdjustmentHours,
  };
};
