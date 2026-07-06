import { VOLUNTEER_BRANCH_NAME, type HourlyRate, type Report, type Youth } from './types';
import { calculateAge } from './data';

export const MANDATORY_HOURS_LIMIT = 90;
export const VOLUNTEER_HOURS_LIMIT = 20;

export interface EditableYouthHours {
  mandatoryHours: number;
  payableHours: number;
}

export interface YouthHoursUpdate {
  mandatoryHours: number;
  payableHours: number;
  manualHoursAdjustment: number;
}

export interface YouthWorkSummary {
  cycleApprovedHours: number;
  mandatoryCompletedHours: number;
  volunteerCompletedHours: number;
  payableCumulativeHours: number;
  payablePendingHours: number;
  currentMonthHours: number;
  currentMonthPayableHours: number;
  payablePendingAmount: number;
  totalEarnedAmount: number;
  manualAdjustmentHours: number;
}

// Parse a local YYYY-MM-DD string without timezone drift.
const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

// Identify volunteer reports so they can be approved and counted separately from work hours.
export const isVolunteerReport = (report: Report) =>
  report.reportType === 'volunteer' || report.branch === VOLUNTEER_BRANCH_NAME;

// Return the beginning of the current work cycle, which always starts on July 1st.
export const getWorkCycleStart = (referenceDate = new Date()) => {
  const year = referenceDate.getMonth() >= 6 ? referenceDate.getFullYear() : referenceDate.getFullYear() - 1;
  return new Date(year, 6, 1);
};

// Check whether a report belongs to the current July-to-June work cycle.
export const isReportInCurrentCycle = (reportDate: string, referenceDate = new Date()) =>
  parseLocalDate(reportDate).getTime() >= getWorkCycleStart(referenceDate).getTime();

// Keep editable hour inputs numeric and non-negative.
const toNonNegativeNumber = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0);

// Check whether a report belongs to the current calendar month.
const isSameMonth = (reportDate: string, referenceDate = new Date()) => {
  const date = parseLocalDate(reportDate);
  return date.getFullYear() === referenceDate.getFullYear() && date.getMonth() === referenceDate.getMonth();
};

// Resolve the hourly rate by the youth's current age.
const getYouthRate = (youth: Youth, rates: HourlyRate[]) => {
  const age = calculateAge(youth.birthDate);
  const matchedRate = rates.find((rate) => rate.age === age);
  return matchedRate?.rate ?? 0;
};

// Sort reports so cumulative hour calculations stay deterministic.
const sortReportsByDate = (reports: Report[]) =>
  reports
    .slice()
    .sort((left, right) => `${left.date}T${left.startTime}`.localeCompare(`${right.date}T${right.startTime}`));

// Return all approved or paid reports from the current work cycle for one youth.
const getCycleTrackedReports = (youthId: string, reports: Report[], referenceDate: Date) =>
  sortReportsByDate(
    reports.filter(
      (report) =>
        report.youthId === youthId &&
        !isVolunteerReport(report) &&
        (report.status === 'approved' || report.status === 'paid') &&
        isReportInCurrentCycle(report.date, referenceDate),
    ),
  );

// Return all approved volunteer reports from the current work cycle for one youth.
const getCycleVolunteerReports = (youthId: string, reports: Report[], referenceDate: Date) =>
  sortReportsByDate(
    reports.filter(
      (report) =>
        report.youthId === youthId &&
        isVolunteerReport(report) &&
        (report.status === 'approved' || report.status === 'paid') &&
        isReportInCurrentCycle(report.date, referenceDate),
    ),
  );

// Sum approved volunteer hours inside the current July-to-June work cycle.
export const getCycleVolunteerHours = (youthId: string, reports: Report[], referenceDate = new Date()) =>
  getCycleVolunteerReports(youthId, reports, referenceDate).reduce((total, report) => total + report.totalHours, 0);

// Sum tracked report hours inside the current work cycle.
const getCycleTrackedHours = (youthId: string, reports: Report[], referenceDate: Date) =>
  getCycleTrackedReports(youthId, reports, referenceDate).reduce((total, report) => total + report.totalHours, 0);

// Normalize guide-edited hours so mandatory hours fill first up to 90 and only the remainder becomes payable.
export const normalizeEditableHours = (mandatoryHours: number, payableHours: number): EditableYouthHours => {
  const totalVisibleHours = toNonNegativeNumber(mandatoryHours) + toNonNegativeNumber(payableHours);

  return {
    mandatoryHours: Math.min(MANDATORY_HOURS_LIMIT, totalVisibleHours),
    payableHours: Math.max(0, totalVisibleHours - MANDATORY_HOURS_LIMIT),
  };
};

// Convert guide-edited visible hours into the hidden manual adjustment used by the summary engine.
export const buildYouthHoursUpdate = (
  youth: Youth,
  reports: Report[],
  mandatoryHours: number,
  payableHours: number,
  referenceDate = new Date(),
): YouthHoursUpdate => {
  const normalizedHours = normalizeEditableHours(mandatoryHours, payableHours);
  const cycleTrackedHours = getCycleTrackedHours(youth.id, reports, referenceDate);
  const alreadyPaidPayableHours = toNonNegativeNumber(Number(youth.lastResetHours ?? 0));
  const desiredEffectiveCycleHours =
    normalizedHours.mandatoryHours + normalizedHours.payableHours + alreadyPaidPayableHours;

  return {
    ...normalizedHours,
    manualHoursAdjustment: desiredEffectiveCycleHours - cycleTrackedHours,
  };
};

// Build the guide/youth summary while keeping July 1st as the only reset point for mandatory hours.
export const buildYouthWorkSummary = (
  youth: Youth,
  reports: Report[],
  rates: HourlyRate[],
  referenceDate = new Date(),
): YouthWorkSummary => {
  const cycleTrackedReports = getCycleTrackedReports(youth.id, reports, referenceDate);
  const manualAdjustmentHours = Number(youth.manualHoursAdjustment ?? 0);
  const volunteerCompletedHours = getCycleVolunteerHours(youth.id, reports, referenceDate);

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

  const effectiveCycleHours = Math.max(0, cycleTrackedHours + manualAdjustmentHours);
  const payableCumulativeHours = Math.max(0, effectiveCycleHours - MANDATORY_HOURS_LIMIT);
  const payablePendingHours = Math.max(0, payableCumulativeHours - toNonNegativeNumber(Number(youth.lastResetHours ?? 0)));
  const hourlyRate = getYouthRate(youth, rates);

  return {
    cycleApprovedHours: effectiveCycleHours,
    mandatoryCompletedHours: Math.min(MANDATORY_HOURS_LIMIT, effectiveCycleHours),
    volunteerCompletedHours,
    payableCumulativeHours,
    payablePendingHours,
    currentMonthHours,
    currentMonthPayableHours,
    payablePendingAmount: payablePendingHours * hourlyRate,
    totalEarnedAmount: payableCumulativeHours * hourlyRate,
    manualAdjustmentHours,
  };
};
