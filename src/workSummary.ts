import { VOLUNTEER_BRANCH_NAME, type HourlyRate, type Report, type Youth } from './types';
import { calculateAge } from './data';

export const MANDATORY_HOURS_LIMIT = 90;
export const VOLUNTEER_HOURS_LIMIT = 20;
export const WORK_CYCLE_RESET_MONTH = 5;
export const WORK_CYCLE_RESET_DAY = 20;

export type ApprovalCoverage = 'mandatory' | 'payable' | 'both';

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
  manualVolunteerAdjustmentHours: number;
}

export interface ReportWorkContribution {
  reportId: string;
  branch: string;
  chargeCommittee: string;
  naturalMandatoryHours: number;
  naturalPayableHours: number;
  countedMandatoryHours: number;
  countedPayableHours: number;
}

export interface PayableBranchTotalsEntry {
  branch: string;
  chargeCommittee: string;
  payableHours: number;
  payableAmount: number;
}

// Parse a local YYYY-MM-DD string without timezone drift.
const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

// Identify volunteer reports so they can be approved and counted separately from work hours.
export const isVolunteerReport = (report: Report) =>
  report.reportType === 'volunteer' || report.branch === VOLUNTEER_BRANCH_NAME;

// Return the beginning of the current work cycle, which resets on June 20th.
export const getWorkCycleStart = (referenceDate = new Date()) => {
  const hasPassedResetDate =
    referenceDate.getMonth() > WORK_CYCLE_RESET_MONTH ||
    (referenceDate.getMonth() === WORK_CYCLE_RESET_MONTH && referenceDate.getDate() >= WORK_CYCLE_RESET_DAY);
  const year = hasPassedResetDate ? referenceDate.getFullYear() : referenceDate.getFullYear() - 1;
  return new Date(year, WORK_CYCLE_RESET_MONTH, WORK_CYCLE_RESET_DAY);
};

// Check whether a report belongs to the current June-20-to-June-19 work cycle.
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

// Determine how an approved report should count toward mandatory and payable hours.
const getApprovalCoverage = (report: Report): ApprovalCoverage => {
  if (
    report.approvalCoverage === 'mandatory' ||
    report.approvalCoverage === 'payable' ||
    report.approvalCoverage === 'both'
  ) {
    return report.approvalCoverage;
  }

  return 'both';
};

// Split report hours into mandatory and payable portions based on the 90-hour cap.
const getNaturalSplit = (cumulativeHours: number, totalHours: number) => {
  const mandatoryHours = Math.max(0, Math.min(MANDATORY_HOURS_LIMIT - cumulativeHours, totalHours));
  const payableHours = Math.max(0, totalHours - mandatoryHours);

  return {
    mandatoryHours,
    payableHours,
  };
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

// Sum approved volunteer hours inside the current June-20-to-June-19 work cycle.
export const getCycleVolunteerHours = (youthId: string, reports: Report[], referenceDate = new Date()) =>
  getCycleVolunteerReports(youthId, reports, referenceDate).reduce((total, report) => total + report.totalHours, 0);

// Sum tracked report hours inside the current work cycle.
// Sum tracked report hours inside the current work cycle.
const getCycleTrackedHours = (youthId: string, reports: Report[], referenceDate: Date) =>
  getCycleTrackedReports(youthId, reports, referenceDate).reduce((total, report) => total + report.totalHours, 0);

// Build per-report mandatory/payable contributions for one youth in the current cycle.
const getCycleWorkContributions = (youth: Youth, reports: Report[], referenceDate: Date) => {
  const workReports = getCycleTrackedReports(youth.id, reports, referenceDate);
  const contributions: ReportWorkContribution[] = [];
  let cumulativeHours = Math.max(0, Number(youth.manualHoursAdjustment ?? 0));

  for (const report of workReports) {
    const split = getNaturalSplit(cumulativeHours, report.totalHours);
    const coverage = getApprovalCoverage(report);
    const countedMandatoryHours =
      coverage === 'mandatory' || coverage === 'both' ? split.mandatoryHours : 0;
    const countedPayableHours = coverage === 'payable' || coverage === 'both' ? split.payableHours : 0;

    contributions.push({
      reportId: report.id ?? `${report.date}-${report.startTime}-${report.branch}`,
      branch: report.branch,
      chargeCommittee: String(report.chargeCommittee ?? '').trim(),
      naturalMandatoryHours: split.mandatoryHours,
      naturalPayableHours: split.payableHours,
      countedMandatoryHours,
      countedPayableHours,
    });

    cumulativeHours += countedMandatoryHours + countedPayableHours;
  }

  return contributions;
};

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

// Preview how one pending report would split into mandatory and payable hours.
export const getReportWorkPreview = (
  youth: Youth,
  reports: Report[],
  report: Report,
  referenceDate = new Date(),
) => {
  const workReports = getCycleTrackedReports(youth.id, reports, referenceDate);
  const targetIndex = workReports.findIndex((item) => item.id === report.id);
  const relevantReports = targetIndex >= 0 ? workReports.slice(0, targetIndex) : workReports;
  let cumulativeHours = Math.max(0, Number(youth.manualHoursAdjustment ?? 0));

  for (const currentReport of relevantReports) {
    const split = getNaturalSplit(cumulativeHours, currentReport.totalHours);
    const coverage = getApprovalCoverage(currentReport);
    const countedMandatoryHours =
      coverage === 'mandatory' || coverage === 'both' ? split.mandatoryHours : 0;
    const countedPayableHours = coverage === 'payable' || coverage === 'both' ? split.payableHours : 0;
    cumulativeHours += countedMandatoryHours + countedPayableHours;
  }

  const split = getNaturalSplit(cumulativeHours, report.totalHours);

  return split;
};

// Aggregate payable hours and amounts by branch for one youth.
export const buildPayableBranchTotals = (
  youth: Youth,
  reports: Report[],
  rates: HourlyRate[],
  referenceDate = new Date(),
): PayableBranchTotalsEntry[] => {
  const contributions = getCycleWorkContributions(youth, reports, referenceDate);
  const rate = getYouthRate(youth, rates);
  const totals = new Map<string, PayableBranchTotalsEntry>();

  contributions.forEach((contribution) => {
    const branchLabel =
      contribution.branch === 'אחר' && contribution.chargeCommittee
        ? `${contribution.branch} (${contribution.chargeCommittee})`
        : contribution.branch;
    const existing = totals.get(branchLabel);
    const payableHours = contribution.countedPayableHours;
    const payableAmount = payableHours * rate;

    if (existing) {
      existing.payableHours += payableHours;
      existing.payableAmount += payableAmount;
      return;
    }

    totals.set(branchLabel, {
      branch: contribution.branch,
      chargeCommittee: contribution.chargeCommittee,
      payableHours,
      payableAmount,
    });
  });

  return [...totals.values()].sort((left, right) => {
    const leftLabel = `${left.branch} ${left.chargeCommittee}`;
    const rightLabel = `${right.branch} ${right.chargeCommittee}`;
    return leftLabel.localeCompare(rightLabel, 'he');
  });
};

// Build the guide/youth summary while keeping the June 20th reset point consistent everywhere.
export const buildYouthWorkSummary = (
  youth: Youth,
  reports: Report[],
  rates: HourlyRate[],
  referenceDate = new Date(),
): YouthWorkSummary => {
  const manualAdjustmentHours = Number(youth.manualHoursAdjustment ?? 0);
  const manualVolunteerAdjustmentHours = Number(youth.manualVolunteerAdjustment ?? 0);
  const volunteerCompletedHours = Math.max(
    0,
    getCycleVolunteerHours(youth.id, reports, referenceDate) + manualVolunteerAdjustmentHours,
  );

  const cycleWorkContributions = getCycleWorkContributions(youth, reports, referenceDate);
  const initialCycleHours = Math.max(0, manualAdjustmentHours);
  let cycleApprovedHours = initialCycleHours;
  let mandatoryCompletedHours = Math.min(MANDATORY_HOURS_LIMIT, initialCycleHours);
  let payableCumulativeHours = Math.max(0, initialCycleHours - MANDATORY_HOURS_LIMIT);
  let currentMonthHours = 0;
  let currentMonthPayableHours = 0;
  let cumulativeCycleHours = initialCycleHours;

  for (const contribution of cycleWorkContributions) {
    const report = reports.find((item) => item.id === contribution.reportId);
    const countedHours = contribution.countedMandatoryHours + contribution.countedPayableHours;

    cycleApprovedHours += countedHours;
    mandatoryCompletedHours += contribution.countedMandatoryHours;
    payableCumulativeHours += contribution.countedPayableHours;
    cumulativeCycleHours += countedHours;

    if (report && isSameMonth(report.date, referenceDate)) {
      currentMonthHours += countedHours;
      currentMonthPayableHours += contribution.countedPayableHours;
    }
  }

  const payablePendingHours = Math.max(0, payableCumulativeHours - toNonNegativeNumber(Number(youth.lastResetHours ?? 0)));
  const hourlyRate = getYouthRate(youth, rates);

  return {
    cycleApprovedHours,
    mandatoryCompletedHours,
    volunteerCompletedHours,
    payableCumulativeHours,
    payablePendingHours,
    currentMonthHours,
    currentMonthPayableHours,
    payablePendingAmount: payablePendingHours * hourlyRate,
    totalEarnedAmount: payableCumulativeHours * hourlyRate,
    manualAdjustmentHours,
    manualVolunteerAdjustmentHours,
  };
};
