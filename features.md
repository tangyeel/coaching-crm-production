# UI Elements by Login Role

## Institute Admin & Teacher — `/dashboard/*` (full nav)

| Page | Route | UI Elements |
|---|---|---|
| **Overview** | `/dashboard` | Stat cards (Students, Teachers, Batches, Present Today), attendance trend area chart (7-day), latest announcements list |
| **Students** | `/dashboard/students` | Search bar, paginated table, Add Student form, bulk import (Excel/CSV + AI), toggle fee status, reset password, remove student |
| **Teachers** | `/dashboard/teachers` | Add teacher form, list table, reset password, remove |
| **Batches** | `/dashboard/batches` | Search, capacity bars, teacher assignment, join code, create/delete batch (Admin only), "Send Alerts" (PRO) |
| **Attendance** | `/dashboard/attendance` | Batch + date picker, Present/Late/Absent chip buttons, save, "Send Alerts" (PRO) |
| **Fees** | `/dashboard/fees` | Stat cards (collected, count), Record Payment form (student dropdown, amount, note), paginated ledger with receipt download |
| **Marks** | `/dashboard/marks` | Batch + exam selector, create exam, scores input per student with percentage badges, "Send Alerts" (PRO) |
| **Reports** | `/dashboard/reports` | Attendance summary (present/late/absent + bars), performance table (scores, %, grade), CSV download links |
| **Announcements** | `/dashboard/announcements` | Publish form (target: whole institute or specific batch), announcements list |
| **Account** | `/dashboard/account` | Change password form; Institute Settings (WhatsApp token, phone ID, join code) — Admin only |

> **Teacher limitations:** Cannot create/delete batches, cannot access Institute Settings.

---

## Student — `/dashboard/*` (limited nav)

| Page | Route | UI Elements |
|---|---|---|
| **Overview** | `/dashboard` | Stat cards (read-only), attendance trend chart, announcements list |
| **Batches** | `/dashboard/batches` | View/search batches (read-only), capacity bars, teacher name, join code display |
| **Announcements** | `/dashboard/announcements` | Read-only announcements list |
| **Account** | `/dashboard/account` | Change password form |

---

## Parent — `/parent`

| Page | UI Elements |
|---|---|
| **Parent Dashboard** | Fee invoices table (date, student name, amount, PAID/DUE status), "Pay Online" button for unpaid invoices (Stripe) |

---

## Public / Auth Pages

| Page | UI Elements |
|---|---|
| `/login` | Email/password form, link to `/enroll` |
| `/signup` | Institute onboarding request form (institute details + admin info) |
| `/signup/admin` | Direct institute creation form (institute + admin + WhatsApp config) |
| `/signup/invite` | 2-step wizard: Step 1 — invite code input + validate; Step 2 — account form (STUDENT sees guardian fields, PARENT sees "Link to Child" fields) |
| `/enroll` | Public enrollment form (join code, student details, guardian info) |

---

## Shared UI Components (all roles)

| Component | Description |
|---|---|
| `Nav.tsx` | Role-filtered top navigation bar |
| `Toast.tsx` | Toast notification system (Framer Motion) |
| `PageTransition.tsx` | Animated page wrapper (fade + slide up) |
| `CountUp.tsx` | Animated number counter |
| `ReceiptButton.tsx` | Receipt PDF download button |
