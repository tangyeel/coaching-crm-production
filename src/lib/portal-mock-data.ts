/* ===== TYPES ===== */
export interface Batch { id: string; name: string; course: string; teacher: string; cap: number; enr: number; code: string; sched: string }
export interface Teacher { id: number; name: string; email: string; phone: string; subject: string; batches: string[] }
export interface Student { id: number; name: string; email: string; phone: string; course: string; batch: string; feeStatus: string; guardian: string; joined: string; status: string }
export interface Fee { id: number; student: string; sid: number; amount: number; date: string; method: string; status: string; receipt: string }
export interface Exam { id: number; name: string; batch: string; date: string; total: number; subject: string }
export interface Announcement { id: number; title: string; body: string; target: string; batch: string; date: string; author: string }
export interface NavItem { id: string; label: string; icon: string }

export interface GradeDist { Ap: number; A: number; Bp: number; B: number; C: number; F: number }
export interface DayStatus { day: string; status: string }
export interface ExamResult { id: number; name: string; subject: string; date: string; total: number; score: number; pct: number; grade: string }

/* ===== RAW DATA ===== */
export const NM = ['Rahul Sharma','Priya Patel','Amit Kumar','Sneha Reddy','Vikram Singh','Ananya Gupta','Rohan Mehta','Kavya Nair','Arjun Desai','Ishita Joshi','Aditya Rao','Pooja Verma','Karan Malhotra','Divya Iyer','Nikhil Pandey','Riya Saxena','Varun Kapoor','Meera Pillai','Sahil Agarwal','Tanvi Bhatt'];

export const CO = ['JEE Advanced','JEE Mains','NEET','CET','Foundation'];

export const DY = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export const BA: Batch[] = [
  { id: 'A1', name: 'JEE Adv — Batch A1', course: 'JEE Advanced', teacher: 'Dr. Anil Verma', cap: 40, enr: 35, code: 'JOIN-A1-X7K9', sched: 'Mon/Wed/Fri 4-6 PM' },
  { id: 'A2', name: 'JEE Adv — Batch A2', course: 'JEE Advanced', teacher: 'Dr. Anil Verma', cap: 40, enr: 38, code: 'JOIN-A2-M3P2', sched: 'Tue/Thu/Sat 10-12 PM' },
  { id: 'B1', name: 'JEE Mains — Batch B1', course: 'JEE Mains', teacher: 'Prof. Sunita Roy', cap: 45, enr: 42, code: 'JOIN-B1-K8L5', sched: 'Mon/Wed/Fri 10-12 PM' },
  { id: 'C1', name: 'NEET — Batch C1', course: 'NEET', teacher: 'Dr. Rajesh Iyer', cap: 50, enr: 47, code: 'JOIN-C1-R2N8', sched: 'Tue/Thu/Sat 4-6 PM' },
  { id: 'D1', name: 'CET — Batch D1', course: 'CET', teacher: 'Ms. Priti Nair', cap: 35, enr: 28, code: 'JOIN-D1-W5Q3', sched: 'Mon/Wed/Fri 2-4 PM' },
  { id: 'E1', name: 'Foundation — Batch E1', course: 'Foundation', teacher: 'Mr. Deepak Joshi', cap: 30, enr: 22, code: 'JOIN-E1-T9H6', sched: 'Sat/Sun 9-12 PM' },
];

export const TC: Teacher[] = [
  { id: 1, name: 'Dr. Anil Verma', email: 'anil@coachflow.com', phone: '+91 98765 43201', subject: 'Physics', batches: ['A1', 'A2'] },
  { id: 2, name: 'Prof. Sunita Roy', email: 'sunita@coachflow.com', phone: '+91 98765 43202', subject: 'Mathematics', batches: ['B1'] },
  { id: 3, name: 'Dr. Rajesh Iyer', email: 'rajesh@coachflow.com', phone: '+91 98765 43203', subject: 'Biology', batches: ['C1'] },
  { id: 4, name: 'Ms. Priti Nair', email: 'priti@coachflow.com', phone: '+91 98765 43204', subject: 'Chemistry', batches: ['D1'] },
  { id: 5, name: 'Mr. Deepak Joshi', email: 'deepak@coachflow.com', phone: '+91 98765 43205', subject: 'All Subjects', batches: ['E1'] },
];

/* ===== GENERATED DATA ===== */
export let ST: Student[] = [];
export let AT: Record<string, Record<string, Record<number, string>>> = {};
export let FE: Fee[] = [];
export let MK: Record<number, Record<number, number>> = {};
export const EX: Exam[] = [
  { id: 1, name: 'Unit Test 1', batch: 'A1', date: '2024-03-15', total: 100, subject: 'Physics' },
  { id: 2, name: 'Mid Term', batch: 'A1', date: '2024-06-20', total: 100, subject: 'Physics' },
  { id: 3, name: 'Unit Test 2', batch: 'A1', date: '2024-08-12', total: 100, subject: 'Mathematics' },
  { id: 4, name: 'Prelims', batch: 'A1', date: '2024-10-05', total: 100, subject: 'Chemistry' },
  { id: 5, name: 'Final Mock', batch: 'A1', date: '2024-12-01', total: 100, subject: 'Physics' },
  { id: 6, name: 'Unit Test 1', batch: 'B1', date: '2024-03-18', total: 100, subject: 'Mathematics' },
  { id: 7, name: 'Mock Test', batch: 'C1', date: '2024-09-10', total: 720, subject: 'Biology' },
];
export const AN: Announcement[] = [
  { id: 1, title: 'Annual Day Celebration', body: 'Annual day will be held on 15th Dec at the main auditorium.', target: 'all', batch: '', date: '2024-12-01', author: 'Admin' },
  { id: 2, title: 'JEE Mock Schedule', body: 'Mock tests for JEE Advanced batches every Saturday.', target: 'batch', batch: 'A1', date: '2024-11-28', author: 'Dr. Anil Verma' },
  { id: 3, title: 'Fee Reminder', body: 'Pending fees for November must be cleared by 5th December.', target: 'all', batch: '', date: '2024-11-25', author: 'Admin' },
  { id: 4, title: 'NEET Special Classes', body: 'Extra NEET classes on Sundays 10 AM to 1 PM.', target: 'batch', batch: 'C1', date: '2024-11-20', author: 'Dr. Rajesh Iyer' },
];

/* Seed for deterministic random */
let _seed = 42;
function seededRandom(): number {
  _seed = (_seed * 16807) % 2147483647;
  return (_seed - 1) / 2147483646;
}

/* Generate all derived data */
export function generateMockData() {
  ST = [];
  AT = {};
  FE = [];
  MK = {};

  for (let i = 0; i < NM.length; i++) {
    const b = BA[i % BA.length];
    ST.push({
      id: i + 1,
      name: NM[i],
      email: NM[i].toLowerCase().replace(' ', '.') + '@email.com',
      phone: '+91 ' + (90000 + i * 1234) + ' ' + (10000 + i * 567),
      course: b.course,
      batch: b.id,
      feeStatus: i < 14 ? 'paid' : i < 17 ? 'partial' : 'due',
      guardian: 'Mr. ' + NM[i].split(' ')[1],
      joined: '2024-' + String(1 + i % 12).padStart(2, '0') + '-' + String(1 + i % 28).padStart(2, '0'),
      status: i < 16 ? 'active' : i < 19 ? 'trial' : 'inactive',
    });
  }

  for (const b of BA) {
    AT[b.id] = {};
    for (const d of DY) {
      AT[b.id][d] = {};
      const batchStudents = ST.filter(s => s.batch === b.id);
      for (const s of batchStudents) {
        const r = seededRandom();
        AT[b.id][d][s.id] = r < 0.75 ? 'present' : r < 0.88 ? 'late' : 'absent';
      }
    }
  }

  ST.forEach((s, i) => {
    FE.push({
      id: i + 1,
      student: s.name,
      sid: s.id,
      amount: [45000, 38000, 52000, 30000, 25000][i % 5],
      date: '2024-' + String(1 + i % 12).padStart(2, '0') + '-' + String(5 + i % 25).padStart(2, '0'),
      method: ['UPI', 'Card', 'Bank Transfer'][i % 3],
      status: s.feeStatus,
      receipt: 'RCP-' + String(1000 + i),
    });
  });

  for (const e of EX) {
    MK[e.id] = {};
    const batchStudents = ST.filter(s => s.batch === e.batch);
    for (const s of batchStudents) {
      MK[e.id][s.id] = Math.round(e.total * (0.3 + seededRandom() * 0.65));
    }
  }
}

/* Call once on module load */
generateMockData();

/* ===== NAV CONFIGS ===== */
export const NA: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'fa-grid-2' },
  { id: 'students', label: 'Students', icon: 'fa-users' },
  { id: 'teachers', label: 'Teachers', icon: 'fa-chalkboard-user' },
  { id: 'batches', label: 'Batches', icon: 'fa-layer-group' },
  { id: 'attendance', label: 'Attendance', icon: 'fa-clipboard-check' },
  { id: 'fees', label: 'Fees', icon: 'fa-indian-rupee-sign' },
  { id: 'marks', label: 'Marks', icon: 'fa-chart-column' },
  { id: 'reports', label: 'Reports', icon: 'fa-file-lines' },
  { id: 'announcements', label: 'Announcements', icon: 'fa-bullhorn' },
  { id: 'account', label: 'Account', icon: 'fa-gear' },
];

export const NT: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'fa-grid-2' },
  { id: 'students', label: 'Students', icon: 'fa-users' },
  { id: 'batches', label: 'Batches', icon: 'fa-layer-group' },
  { id: 'attendance', label: 'Attendance', icon: 'fa-clipboard-check' },
  { id: 'marks', label: 'Marks', icon: 'fa-chart-column' },
  { id: 'announcements', label: 'Announcements', icon: 'fa-bullhorn' },
  { id: 'account', label: 'Account', icon: 'fa-gear' },
];

export const NS: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: 'fa-grid-2' },
  { id: 'performance', label: 'Performance', icon: 'fa-chart-column' },
  { id: 'attendance', label: 'Attendance', icon: 'fa-clipboard-check' },
  { id: 'batches', label: 'My Batches', icon: 'fa-layer-group' },
  { id: 'announcements', label: 'Announcements', icon: 'fa-bullhorn' },
  { id: 'account', label: 'Account', icon: 'fa-gear' },
];

export const NP: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: 'fa-grid-2' },
  { id: 'marks', label: 'Marks', icon: 'fa-chart-column' },
  { id: 'attendance', label: 'Attendance', icon: 'fa-clipboard-check' },
  { id: 'fees', label: 'Fees', icon: 'fa-indian-rupee-sign' },
  { id: 'announcements', label: 'Announcements', icon: 'fa-bullhorn' },
  { id: 'account', label: 'Account', icon: 'fa-gear' },
];

/* ===== HELPERS ===== */
export const CL = ['#F0B429', '#06B6D4', '#10B981', '#A855F7', '#EF4444'];

export function fmt(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

export function fmtC(n: number): string {
  return 'Rs ' + fmt(n);
}

export function getInitials(name: string, idx: number): { initials: string; bg: string; color: string } {
  const cs = ['var(--accd)', 'var(--infd)', 'var(--okd)', 'var(--purd)'];
  const tc = ['var(--acc)', 'var(--inf)', 'var(--ok)', 'var(--pur)'];
  return {
    initials: name.split(' ').map(n => n[0]).join(''),
    bg: cs[idx % 4],
    color: tc[idx % 4],
  };
}

export function statusBadge(s: string): { label: string; cls: string; dot: boolean } {
  const m: Record<string, { label: string; cls: string }> = {
    paid: { label: 'Paid', cls: 'b-ok' },
    partial: { label: 'Partial', cls: 'b-acc' },
    due: { label: 'Due', cls: 'b-err' },
    active: { label: 'Active', cls: 'b-ok' },
    trial: { label: 'Trial', cls: 'b-acc' },
    inactive: { label: 'Inactive', cls: 'b-err' },
  };
  const v = m[s] || { label: s, cls: 'b-inf' };
  return { label: v.label, cls: v.cls, dot: s === 'active' };
}

export function getGrade(p: number): string {
  return p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B+' : p >= 60 ? 'B' : p >= 50 ? 'C' : 'F';
}

export function getGradeColor(p: number): string {
  return p >= 70 ? 'var(--ok)' : p >= 50 ? 'var(--acc)' : 'var(--err)';
}

export function getGradeBadge(p: number): string {
  return p >= 70 ? 'b-ok' : p >= 50 ? 'b-acc' : 'b-err';
}

export function getExamData(sid: number): ExamResult[] {
  return EX
    .filter(e => MK[e.id] && MK[e.id][sid] !== undefined)
    .map(e => {
      const sc = MK[e.id][sid];
      const pct = Math.round(sc / e.total * 100);
      return { id: e.id, name: e.name, subject: e.subject, date: e.date, total: e.total, score: sc, pct, grade: getGrade(pct) };
    });
}

export function getAttendanceData(sid: number, bid: string): DayStatus[] {
  const batchAtt = AT[bid] || {};
  return DY.map(d => {
    const st = batchAtt[d] ? batchAtt[d][sid] : 'present';
    return { day: d, status: st as string };
  });
}

export function gradeLegendHTML(grades: GradeDist): { grade: string; count: number; color: string }[] {
  return [
    { grade: 'A+', count: grades.Ap || 0, color: '#10B981' },
    { grade: 'A', count: grades.A || 0, color: '#06B6D4' },
    { grade: 'B+', count: grades.Bp || 0, color: '#F0B429' },
    { grade: 'B', count: grades.B || 0, color: '#A855F7' },
    { grade: 'C', count: grades.C || 0, color: '#EF4444' },
    { grade: 'F', count: grades.F || 0, color: '#55556A' },
  ];
}

export function computeGradeDist(results: ExamResult[]): GradeDist {
  const gd: GradeDist = { Ap: 0, A: 0, Bp: 0, B: 0, C: 0, F: 0 };
  results.forEach(e => {
    if (e.grade === 'A+') gd.Ap++;
    else if (e.grade === 'A') gd.A++;
    else if (e.grade === 'B+') gd.Bp++;
    else if (e.grade === 'B') gd.B++;
    else if (e.grade === 'C') gd.C++;
    else gd.F++;
  });
  return gd;
}
