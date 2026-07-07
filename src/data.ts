import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from './firebase';
import type {
  Branch,
  CurrentUser,
  HourlyRate,
  ManagerCredential,
  Report,
  Youth,
} from './types';
import { VOLUNTEER_BRANCH_NAME } from './types';

const REQUEST_TIMEOUT_MS = 12000;

// Wraps a Firestore promise with a timeout so hung requests fail fast in the UI.
const withTimeout = async <T>(promise: Promise<T>, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Request timed out'));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

// Converts a Firestore branch document into the app's Branch shape.
const normalizeBranch = (branchDoc: DocumentData | undefined, id?: string): Branch => ({
  name: String(branchDoc?.name ?? id ?? '').trim(),
  password: String(branchDoc?.password ?? '').trim(),
});

// Converts a Firestore youth document into the app's Youth shape.
const normalizeYouth = (youthDoc: DocumentData | undefined, id: string): Youth => ({
  id,
  name: String(youthDoc?.name ?? '').trim(),
  birthDate: String(youthDoc?.birthDate ?? ''),
  personalBudgetNumber: String(youthDoc?.personalBudgetNumber ?? '').trim(),
  totalHours: Number(youthDoc?.totalHours ?? 0),
  lastResetHours: Number(youthDoc?.lastResetHours ?? 0),
  manualHoursAdjustment: Number(youthDoc?.manualHoursAdjustment ?? 0),
  manualVolunteerAdjustment: Number(youthDoc?.manualVolunteerAdjustment ?? 0),
  budget: youthDoc?.budget === undefined ? undefined : Number(youthDoc.budget),
});

// Converts a Firestore report document into the app's Report shape.
const normalizeReport = (reportDoc: DocumentData | undefined, id: string): Report => ({
  id,
  youthId: String(reportDoc?.youthId ?? ''),
  youthName: String(reportDoc?.youthName ?? ''),
  branch: String(reportDoc?.branch ?? ''),
  reportType: reportDoc?.reportType === 'volunteer' || reportDoc?.branch === VOLUNTEER_BRANCH_NAME ? 'volunteer' : 'work',
  approvalCoverage:
    reportDoc?.approvalCoverage === 'mandatory' ||
    reportDoc?.approvalCoverage === 'payable' ||
    reportDoc?.approvalCoverage === 'both'
      ? reportDoc.approvalCoverage
      : reportDoc?.status === 'approved' || reportDoc?.status === 'paid'
        ? 'both'
        : undefined,
  chargeCommittee: String(reportDoc?.chargeCommittee ?? ''),
  details: String(reportDoc?.details ?? ''),
  date: String(reportDoc?.date ?? ''),
  startTime: String(reportDoc?.startTime ?? ''),
  endTime: String(reportDoc?.endTime ?? ''),
  totalHours: Number(reportDoc?.totalHours ?? 0),
  approvalTarget: reportDoc?.approvalTarget === 'guide' ? 'guide' : 'manager',
  status:
    reportDoc?.status === 'approved' ||
    reportDoc?.status === 'rejected' ||
    reportDoc?.status === 'paid'
      ? reportDoc.status
      : 'pending',
  reviewNote: String(reportDoc?.reviewNote ?? ''),
});

// Loads all branch records from Firestore.
export const getBranches = async (): Promise<Branch[]> => {
  const querySnapshot = await withTimeout(getDocs(collection(db, 'branches')));
  return querySnapshot.docs
    .map((branchDoc) => normalizeBranch(branchDoc.data(), branchDoc.id))
    .filter((branch) => branch.name);
};

// Builds manager login credentials from branch records.
export const getManagers = async (): Promise<ManagerCredential[]> => {
  const branches = await getBranches();
  return branches.map((branch) => ({ branch: branch.name, password: branch.password }));
};

// Creates or replaces a branch document in Firestore.
export const saveBranch = async (branch: Branch): Promise<boolean> => {
  try {
    const normalizedBranch = normalizeBranch(branch);
    if (!normalizedBranch.name || !normalizedBranch.password) {
      return false;
    }

    await setDoc(doc(db, 'branches', normalizedBranch.name), normalizedBranch);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// Updates the password for an existing branch.
export const updateBranchPassword = async (branchName: string, newPassword: string) => {
  await updateDoc(doc(db, 'branches', branchName), { password: newPassword.trim() });
};

// Deletes a branch document from Firestore.
export const deleteBranch = async (branchName: string) => {
  await deleteDoc(doc(db, 'branches', branchName));
};

// Stores the guide login password in Firestore config.
export const updateGuidePassword = async (newPassword: string) => {
  await setDoc(doc(db, 'config', 'guideSettings'), { password: newPassword.trim() }, { merge: true });
};

// Reads the guide login password from Firestore config.
export const getGuidePassword = async (): Promise<string> => {
  const guideDoc = await withTimeout(getDoc(doc(db, 'config', 'guideSettings')));
  return String(guideDoc.data()?.password ?? 'admin');
};

// Loads all youth records from Firestore.
export const getYouth = async (): Promise<Youth[]> => {
  const querySnapshot = await withTimeout(getDocs(collection(db, 'youth')));
  return querySnapshot.docs.map((youthDoc) => normalizeYouth(youthDoc.data(), youthDoc.id));
};

// Creates a new youth record with a deterministic document id.
export const addYouth = async (youth: Omit<Youth, 'id'>) => {
  const id = `${String(youth.name).trim()}_${String(youth.personalBudgetNumber).trim()}`;
  await setDoc(doc(db, 'youth', id), {
    ...youth,
    id,
    totalHours: Number(youth.totalHours ?? 0),
    lastResetHours: Number(youth.lastResetHours ?? 0),
    manualHoursAdjustment: Number(youth.manualHoursAdjustment ?? 0),
    manualVolunteerAdjustment: Number(youth.manualVolunteerAdjustment ?? 0),
  });
  return id;
};

// Applies partial updates to an existing youth record.
export const updateYouth = async (youthId: string, updates: Partial<Youth>) => {
  await updateDoc(doc(db, 'youth', youthId), updates);
};

// Deletes a youth record and all reports linked to that youth.
export const deleteYouth = async (youthId: string) => {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'youth', youthId));

  const relatedReports = await getDocs(query(collection(db, 'reports'), where('youthId', '==', youthId)));
  relatedReports.docs.forEach((reportDoc) => {
    batch.delete(reportDoc.ref);
  });

  await batch.commit();
};

// Marks the current payable-hour balance as reset for one youth.
export const resetPaidHours = async (youthId: string, currentTotal: number) => {
  await updateDoc(doc(db, 'youth', youthId), { lastResetHours: Number(currentTotal) });
};

// Atomically resets payable balances and marks approved reports as paid.
export const finalizePaymentCycle = async (
  youthUpdates: { youthId: string; lastResetHours: number }[],
  reportIds: string[]
) => {
  const batch = writeBatch(db);

  youthUpdates.forEach((update) => {
    const youthRef = doc(db, 'youth', update.youthId);
    batch.update(youthRef, { lastResetHours: update.lastResetHours });
  });

  reportIds.forEach((id) => {
    const reportRef = doc(db, 'reports', id);
    batch.update(reportRef, { status: 'paid' });
  });

  await batch.commit();
};

// Loads all hourly rate records from Firestore.
export const getRates = async (): Promise<HourlyRate[]> => {
  const querySnapshot = await withTimeout(getDocs(collection(db, 'rates')));
  return querySnapshot.docs.map((rateDoc) => ({ id: rateDoc.id, ...rateDoc.data() }) as HourlyRate);
};

// Adds a new hourly rate record.
export const addRate = async (rate: Omit<HourlyRate, 'id'>) => {
  await addDoc(collection(db, 'rates'), rate);
};

// Deletes an hourly rate record.
export const deleteRate = async (rateId: string) => {
  await deleteDoc(doc(db, 'rates', rateId));
};

// Updates an existing hourly rate record.
export const updateRate = async (rateId: string, updates: Partial<HourlyRate>) => {
  await updateDoc(doc(db, 'rates', rateId), updates);
};

// Creates a new work or volunteer report.
export const addReport = async (report: Omit<Report, 'id'>) => {
  await addDoc(collection(db, 'reports'), report);
};

// Loads all report records from Firestore.
export const getReports = async (): Promise<Report[]> => {
  const querySnapshot = await withTimeout(getDocs(collection(db, 'reports')));
  return querySnapshot.docs.map((reportDoc) => normalizeReport(reportDoc.data(), reportDoc.id));
};

// Applies partial updates to an existing report.
export const updateReport = async (reportId: string, updates: Partial<Report>) => {
  await updateDoc(doc(db, 'reports', reportId), updates);
};

// Calculates age in full years from an ISO birth date string.
export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();

  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return age;
};

// Persists the signed-in user in browser local storage.
export const setCurrentUser = (user: CurrentUser) => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

// Reads the signed-in user from browser local storage.
export const getCurrentUser = (): CurrentUser | null => {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
};

// Clears the signed-in user from browser local storage.
export const logout = () => {
  localStorage.removeItem('currentUser');
};
