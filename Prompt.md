# PROMPT: Build an MVP Coaching CRM — "CoachFlow"

## PROJECT OVERVIEW

Build a full-stack MVP Coaching/Institute CRM called **"CoachFlow"** with four user roles: **Admin (Onboarder)**, **Teacher**, **Student**, and **Parent**. The system must use **Appwrite** as the backend (Auth + Database + Storage + Functions), integrate with **Meta WhatsApp Business API** for sending marks/attendance notifications per institute, and feature **rich interactive dashboards** with high-quality charts. Use a single Next.js 14+ (App Router) codebase with Tailwind CSS.

---

## TECH STACK (strictly follow)

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui components
- **Charts:** Recharts (for all dashboards — must look premium, not default)
- **Backend/BaaS:** Appwrite (Self-hosted or Cloud) — Auth, Database, Storage, Functions
- **WhatsApp:** Meta WhatsApp Business API (Cloud API) — token + phone_number_id stored per institute
- **State:** React Context or Zustand for client state
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Date:** date-fns
- **Tables:** TanStack Table (for sortable/filterable data tables)

---

## APPWRITE DATABASE SCHEMA

Create these collections in Appwrite. Every document must include Appwrite's default `$id`, `$createdAt`, `$updatedAt`.

*Note on Appwrite Types: For fields like `schedule` or `template_params` that require arrays, store them as standard JSON strings in Appwrite and parse them on the client, or use Appwrite's native string array attribute if supported by the current SDK.*

### 1. `institutes`
| Field | Type | Required | Notes |
|---|---|---|---|
| name | string | yes | Institute name |
| address | string | yes | |
| phone | string | yes | Institute contact |
| email | string | yes | |
| logo | string (file ID) | no | Uploaded to Appwrite Storage |
| whatsapp_phone_number_id | string | yes | Meta Phone Number ID |
| whatsapp_access_token | string (encrypted) | yes | Meta Access Token |
| whatsapp_template_marks | string | yes | e.g. "marks_notification" |
| whatsapp_template_attendance | string | yes | e.g. "attendance_notification" |
| is_active | boolean | yes | default true |
| subscription_plan | string | yes | "free" / "pro" / "enterprise" |
| max_students | integer | yes | |
| created_by | string (user ID) | yes | Admin who created it |

**Indexes:** `name` (key), `created_by` (key)

### 2. `users_profile`
| Field | Type | Required | Notes |
|---|---|---|---|
| user_id | string (Appwrite user ID) | yes | |
| institute_id | string (document ID) | yes | FK → institutes |
| role | string (enum) | yes | "admin" / "teacher" / "student" / "parent" |
| first_name | string | yes | |
| last_name | string | yes | |
| phone | string | yes | With country code, e.g. +919876543210 |
| avatar | string (file ID) | no | |
| is_active | boolean | yes | default true |
| parent_id | string (user ID) | no | Only for students — links to parent |
| student_id | string (user ID) | no | Only for parents — links to student |

**Indexes:** `user_id` (unique), `institute_id` + `role` (composite), `phone` (key), `parent_id` (key)

### 3. `batches`
| Field | Type | Required | Notes |
|---|---|---|---|
| institute_id | string | yes | FK → institutes |
| name | string | yes | e.g. "Class 10 - Batch A" |
| subject | string | yes | |
| teacher_id | string (user ID) | yes | FK → users_profile |
| academic_year | string | yes | e.g. "2024-25" |
| schedule | string (JSON) | yes | Array like ["mon","wed","fri"] stored as string |
| time | string | yes | e.g. "16:00-17:30" |
| max_strength | integer | yes | |
| is_active | boolean | yes | default true |

**Indexes:** `institute_id` + `is_active` (composite), `teacher_id` (key)

### 4. `batch_students` (junction table)
| Field | Type | Required | Notes |
|---|---|---|---|
| batch_id | string | yes | FK → batches |
| student_id | string (user ID) | yes | FK → users_profile |
| enrollment_date | string (datetime) | yes | ISO string |
| is_active | boolean | yes | default true |

**Indexes:** `batch_id` + `student_id` (unique composite), `student_id` (key)

### 5. `exams`
| Field | Type | Required | Notes |
|---|---|---|---|
| institute_id | string | yes | |
| batch_id | string | yes | FK → batches |
| name | string | yes | e.g. "Unit Test 1" |
| exam_type | string | yes | "unit_test" / "mid_term" / "final" / "quiz" |
| total_marks | number | yes | |
| date | string (date) | yes | |
| subject | string | yes | |
| created_by | string (user ID) | yes | Teacher who created |

**Indexes:** `batch_id` (key), `institute_id` (key), `date` (key)

### 6. `marks`
| Field | Type | Required | Notes |
|---|---|---|---|
| exam_id | string | yes | FK → exams |
| student_id | string (user ID) | yes | FK → users_profile |
| marks_obtained | number | yes | |
| remarks | string | no | |
| whatsapp_sent | boolean | yes | default false |
| whatsapp_sent_at | string (datetime) | no | |

**Indexes:** `exam_id` + `student_id` (unique composite), `student_id` (key)

### 7. `attendance`
| Field | Type | Required | Notes |
|---|---|---|---|
| batch_id | string | yes | FK → batches |
| date | string (date) | yes | |
| student_id | string (user ID) | yes | FK → users_profile |
| status | string | yes | "present" / "absent" / "late" |
| marked_by | string (user ID) | yes | Teacher |
| whatsapp_sent | boolean | yes | default false |
| whatsapp_sent_at | string (datetime) | no | |

**Indexes:** `batch_id` + `date` + `student_id` (unique composite), `student_id` + `date` (composite), `date` (key)

### 8. `whatsapp_logs`
| Field | Type | Required | Notes |
|---|---|---|---|
| institute_id | string | yes | |
| recipient_phone | string | yes | |
| recipient_type | string | yes | "student" / "parent" |
| message_type | string | yes | "marks" / "attendance" |
| template_name | string | yes | |
| template_params | string (JSON) | yes | The parameters sent |
| meta_message_id | string | no | Response ID from Meta |
| status | string | yes | "sent" / "delivered" / "read" / "failed" |
| error_message | string | no | |
| related_id | string | no | exam_id or attendance record ID |

**Indexes:** `institute_id` (key), `recipient_phone` (key), `status` (key), `message_type` (key)

### 9. `notifications` (in-app)
| Field | Type | Required | Notes |
|---|---|---|---|
| user_id | string (user ID) | yes | |
| institute_id | string | yes | |
| title | string | yes | |
| message | string | yes | |
| type | string | yes | "marks" / "attendance" / "general" |
| is_read | boolean | yes | default false |
| related_id | string | no | |

**Indexes:** `user_id` + `is_read` (composite), `user_id` (key)

---

## AUTHENTICATION & ROLE FLOW

### Signup Flow:
1. **Admin** signs up → selects "Create Institute" → fills institute details + WhatsApp credentials → becomes Admin+Onboarder
2. **Teacher** signs up → enters Institute Invite Code (generated by admin) → auto-linked to institute with role "teacher"
3. **Student** signs up → enters Institute Invite Code → auto-linked with role "student" → optionally links to parent
4. **Parent** signs up → enters Institute Invite Code → selects "I'm a parent" → searches/links to their child via student's phone or enrollment ID → role "parent"

### Login:
- Appwrite Email/Password auth
- After login, fetch `users_profile` by `user_id` to determine role and institute
- Redirect to role-specific dashboard

### Middleware Protection:
- Use Next.js middleware to check Appwrite session cookie
- Check role from `users_profile` and protect routes:
  - `/admin/*` → admin only
  - `/teacher/*` → teacher only
  - `/student/*` → student only
  - `/parent/*` → parent only

---

## ROLE-BASED FEATURES (detailed)

### 🔷 ADMIN / ONBOARDER DASHBOARD (`/admin`)

#### Dashboard Home:
- **KPI Cards** (animated counters): Total Students, Total Teachers, Active Batches, Today's Attendance %, WhatsApp Messages Sent (this month)
- **Line Chart:** Student enrollment trend (last 12 months)
- **Bar Chart:** Attendance percentage per batch (last 30 days)
- **Doughnut Chart:** Student distribution by subject/batch
- **Recent Activity Feed:** Last 10 actions (new enrollment, exam created, WhatsApp sent, etc.)

#### Institute Settings (`/admin/settings`):
- Edit institute name, address, logo upload
- **WhatsApp Configuration:** 
  - Input fields for `Phone Number ID` and `Access Token` (masked display, edit on click)
  - Input for template names (marks_notification, attendance_notification)
  - **Test WhatsApp** button → sends a test message to admin's phone
  - Show connection status indicator (green dot = active, red = failed)
- Generate Invite Codes for teacher/student/parent (with expiry, usage limit)
- View all generated invite codes with usage stats

#### User Management (`/admin/users`):
- **Teachers Tab:** List all teachers → Add new teacher (name, phone, email, subjects) → Assign to batches → Deactivate
- **Students Tab:** Full data table with search, filter by batch, filter by active/inactive → Add student manually → Assign to batches → Link to parent → Bulk import via CSV
- **Parents Tab:** List parents → Show linked students → Reassign parent to different student

#### Batch Management (`/admin/batches`):
- Create/Edit/Delete batches
- Assign teacher to batch
- View enrolled students per batch
- Batch capacity utilization bar

#### Exam Management (`/admin/exams`):
- View all exams across batches
- Filter by batch, subject, exam type, date range
- **Exam-wise Performance Chart:** Box plot or violin chart showing marks distribution per exam

#### WhatsApp Analytics (`/admin/whatsapp`):
- **Line Chart:** Messages sent per day (last 30 days)
- **Pie Chart:** Delivery status breakdown (sent/delivered/read/failed)
- **Table:** Recent WhatsApp logs with filters
- Error troubleshooting panel (show failed messages with error reasons)

#### Reports (`/admin/reports`):
- Export attendance report (CSV/PDF) — filterable by batch, date range
- Export marks report — filterable by batch, exam, student
- Batch comparison report — average marks per batch per exam

---

### 🔷 TEACHER DASHBOARD (`/teacher`)

#### Dashboard Home:
- **KPI Cards:** My Batches count, Total Students across my batches, Today's Classes, Attendance % (my batches, this week)
- **Bar Chart:** My batch-wise average marks comparison (latest exam)
- **Line Chart:** My class attendance trend (last 30 days)
- **Upcoming Schedule:** Today's classes as timeline cards

#### Attendance (`/teacher/attendance`):
- **Step 1:** Select Batch → shows date picker (defaults to today)
- **Step 2:** Load all students in that batch for that date
- **Step 3:** Grid/List view with each student showing:
  - Avatar, Name, Roll number
  - Three buttons: ✅ Present / ❌ Absent / ⏰ Late (toggle, visually distinct)
  - "Select All Present" quick action
  - "Mark All Absent" quick action
- **Step 4:** Submit → saves to `attendance` collection → **triggers WhatsApp notification to parents** (async via Appwrite Function)
- **History Tab:** View past attendance by date, with filters
- **Calendar Heatmap:** Visual calendar showing attendance % per day (green/yellow/red cells)

#### Marks Entry (`/teacher/marks`):
- **Step 1:** Select Batch → Select Exam (from dropdown of exams for that batch)
- **Step 2:** Load all students → table with:
  - Student name, Previous exam marks (for reference)
  - Input field for marks obtained (validated: 0 to total_marks)
  - Optional remarks field
  - Real-time validation — red border if > total_marks, show percentage calculated live
- **Step 3:** Submit All → saves to `marks` collection → **triggers WhatsApp notification**
- **Bulk Upload Tab:** Upload CSV with columns [student_phone, marks_obtained, remarks] → parse, validate, preview table, then confirm save
- **History Tab:** View/edit previously entered marks

#### My Exams (`/teacher/exams`):
- Create new exam: name, type, date, total marks, subject
- List all my exams with status (upcoming / completed / marks pending)
- Quick actions: Enter Marks / View Results / Send WhatsApp Reminder

#### My Students (`/teacher/students`):
- List all students across my batches
- Click student → detailed profile: attendance %, marks trend (sparkline), all exam marks

#### Performance Analytics (`/teacher/analytics`):
- **Radar Chart:** Batch average across different exams
- **Stacked Bar Chart:** Marks distribution (0-30%, 30-60%, 60-80%, 80-100%) per exam
- **Scatter Plot:** Student attendance % vs marks % correlation
- Top 5 / Bottom 5 performers per batch

---

### 🔷 STUDENT DASHBOARD (`/student`)

#### Dashboard Home:
- **Welcome Card** with batch info, upcoming class schedule
- **KPI Cards:** My Attendance % (this month), My Average Marks, My Rank in Batch, Upcoming Exams
- **Line Chart:** My marks trend across exams
- **Gauge Chart:** Overall attendance percentage (circular progress, color-coded: green >85%, yellow 70-85%, red <70%)
- **Recent Notifications** list

#### My Attendance (`/student/attendance`):
- **Calendar View:** Full month calendar with color-coded cells (green=present, red=absent, yellow=late, gray=no class)
- **Stats Bar:** Total Present, Absent, Late days with counts
- **Table:** Date-wise attendance log

#### My Marks (`/student/marks`):
- **Table:** All exams with marks obtained, total marks, percentage, batch average, rank
- **Bar Chart:** My marks vs batch average (grouped bars) per exam
- **Line Chart:** My performance trend over time
- **Subject-wise Breakdown:** If multiple subjects, radar chart

#### My Batch (`/student/batch`):
- Batch details: teacher, schedule, total students
- Batchmates list
- Batch leaderboard (anonymous or ranked)

#### Notifications (`/student/notifications`):
- In-app notification list with read/unread
- Types: marks published, attendance marked, exam scheduled, general announcement

---

### 🔷 PARENT DASHBOARD (`/parent`)

#### Dashboard Home:
- **Child Info Card:** Child's name, batch, teacher, attendance %, average marks
- **KPI Cards:** Child's Attendance %, Child's Average Marks, Upcoming Exams, WhatsApp Alerts Received
- **Line Chart:** Child's marks trend
- **Gauge Chart:** Child's attendance percentage
- **Recent Alerts:** WhatsApp messages that were sent (from whatsapp_logs)

#### Child's Attendance (`/parent/attendance`):
- Same calendar view as student but for linked child
- Monthly attendance summary
- Absence alerts highlighted

#### Child's Marks (`/parent/marks`):
- Same marks table and charts as student view
- **Comparison:** Child's marks vs batch average (highlighted)
- Exam-wise detailed breakdown

#### WhatsApp Alert History (`/parent/alerts`):
- Table of all WhatsApp messages sent to parent
- Columns: Date, Type (marks/attendance), Message preview, Status (sent/delivered/read/failed)
- Filter by type, date range, status

#### Notifications (`/parent/notifications`):
- In-app notifications
- Option to update phone number (for WhatsApp delivery)

---

## WHATSAPP INTEGRATION (CRITICAL — implement carefully)

*Note on Webhook: The `whatsapp-webhook` Appwrite Function MUST include the standard Meta `hub.challenge` GET request verification logic alongside the POST request handler for status updates.*

### Architecture:
- Use **Appwrite Functions** (Node.js runtime) for all WhatsApp API calls — NEVER call Meta API from frontend
- Store `whatsapp_access_token` and `whatsapp_phone_number_id` per institute in `institutes` collection
- Token should be stored as-is for MVP (in production, use Appwrite's encryption or a secrets manager)

### Appwrite Function: `send-whatsapp-notification`
**Trigger:** Called from frontend after attendance submit or marks submit (via Appwrite SDK's `functions.createExecution()`)

**Input Payload:**
```json
{
  "institute_id": "xxx",
  "message_type": "marks" | "attendance",
  "recipient_phone": "+919876543210",
  "template_name": "marks_notification",
  "template_params": ["Student Name", "Exam Name", "45", "50", "90%"],
  "related_id": "exam_or_attendance_id",
  "recipient_type": "parent" | "student"
}
```

**Function Logic:**
1. Fetch institute document to get `whatsapp_phone_number_id` and `whatsapp_access_token`
2. If recipient_type is "parent", fetch the student's parent's phone from `users_profile`
3. Make POST request to `https://graph.facebook.com/v18.0/{phone_number_id}/messages`
4. Headers: `Authorization: Bearer {access_token}`, `Content-Type: application/json`
5. Body (template message format):
```json
{
  "messaging_product": "whatsapp",
  "to": "919876543210",
  "type": "template",
  "template": {
    "name": "marks_notification",
    "language": { "code": "en" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Student Name" },
          { "type": "text", "text": "Unit Test 1" },
          { "type": "text", "text": "45" },
          { "type": "text", "text": "50" },
          { "type": "text", "text": "90%" }
        ]
      }
    ]
  }
}
```
6. Log result to `whatsapp_logs` collection — success: store `meta_message_id`, failure: store `error_message`
7. Update the source record (`marks.whatsapp_sent = true` or `attendance.whatsapp_sent = true`)
8. Create in-app notification in `notifications` collection

### WhatsApp Webhook (Appwrite Function: `whatsapp-webhook`):
- Create a webhook endpoint that Meta calls for status updates
- Updates `whatsapp_logs.status` to "delivered" or "read" based on webhook payload

### Template Examples (admin configures these names in settings):
- **attendance_notification:** "Hi {{1}}, {{2}} was marked {{3}} on {{4}} in {{5}}."
- **marks_notification:** "Hi {{1}}, {{2}} scored {{3}} out of {{4}} ({{5}}) in {{6}}."

---

## UI/UX DESIGN SYSTEM

### Color Palette (Dark Professional Theme):
- `--bg-primary`: `#0a0a0f` (near black)
- `--bg-secondary`: `#12121a` (card backgrounds)
- `--bg-tertiary`: `#1a1a2e` (elevated elements)
- `--border`: `#2a2a3e`
- `--text-primary`: `#f0f0f5`
- `--text-secondary`: `#8888a0`
- `--accent-primary`: `#6c5ce7` (purple — primary actions)
- `--accent-secondary`: `#00cec9` (teal — success/positive)
- `--accent-warning`: `#fdcb6e` (yellow — warnings)
- `--accent-danger`: `#ff6b6b` (red — errors/absent)
- `--accent-info`: `#74b9ff` (blue — info)

### Light Theme Toggle:
Also support a light theme with appropriate inverted colors. Store preference in localStorage.

### Typography:
- Font: "Inter" (Google Fonts) — clean, modern
- Headings: font-semibold, tracking-tight
- Body: font-normal, text-sm/text-base

### Components (use shadcn/ui as base, customize heavily):
- **Cards:** Subtle border, slight glass morphism effect (`backdrop-blur`), hover lift
- **KPI Cards:** Icon on left, large number (font-3xl, font-bold, tabular-nums), label below, subtle gradient left border (4px)
- **Tables:** Striped rows, hover highlight, sticky header, sorting arrows, pagination
- **Buttons:** Rounded-lg, subtle shadow on hover, loading spinner state
- **Forms:** Floating labels or top-aligned labels, clear validation errors, focus ring with accent color
- **Sidebar:** Collapsible, icon + label, active state with accent background, role badge at top
- **Charts:** Custom tooltips, gradient fills, smooth animations on load, responsive containers

### Chart Styling Rules (MUST follow):
- NO default Recharts colors. Use the palette above.
- Line charts: Gradient fill under line, dots on hover only, smooth curves (`type="monotone"`)
- Bar charts: Rounded top corners (`radius={[4,4,0,0]}`), subtle border, gradient fill
- Pie/Doughnut: Custom labels with lines, center text for doughnut, legend below
- All charts: Custom tooltip with dark background, rounded corners, formatted values
- All charts: Responsive container (`width="100%" height={300}`)
- Add subtle grid lines with very low opacity

### Layout:
- **Sidebar Layout:** Fixed left sidebar (260px expanded, 72px collapsed) + top header bar + main content area
- **Header:** Breadcrumb, search (Cmd+K), notification bell with badge, user avatar dropdown
- **Mobile:** Bottom tab navigation, sidebar as overlay

### Animations:
- Page transitions: fade-in + slight slide-up (150ms)
- KPI number counters: Count-up animation on mount
- Chart animations: Recharts `isAnimationActive={true}` with 800ms duration
- Skeleton loaders for all data-fetching states
- Toast notifications for actions (success/error)

---

## PAGE STRUCTURE & ROUTING

```text
/                           → Redirect based on role
/login                      → Login page
/signup                     → Signup with role selection
/signup/admin               → Admin + Institute creation form
/signup/invite              → Invite code entry (teacher/student/parent)

/admin                      → Admin dashboard
/admin/settings             → Institute + WhatsApp settings
/admin/users                → User management (tabs: teachers/students/parents)
/admin/users/teachers       → Teachers list
/admin/users/students       → Students list  
/admin/users/parents        → Parents list
/admin/batches              → Batch management
/admin/exams                → Exam oversight
/admin/whatsapp             → WhatsApp analytics
/admin/reports              → Export reports

/teacher                    → Teacher dashboard
/teacher/attendance         → Mark attendance
/teacher/attendance/history → Attendance history
/teacher/marks              → Enter marks
/teacher/marks/upload       → Bulk CSV upload
/teacher/marks/history      → Marks history
/teacher/exams              → My exams
/teacher/students           → My students
/teacher/analytics          → Performance analytics

/student                    → Student dashboard
/student/attendance         → My attendance
/student/marks              → My marks
/student/batch              → My batch info
/student/notifications      → Notifications

/parent                     → Parent dashboard
/parent/attendance          → Child's attendance
/parent/marks               → Child's marks
/parent/alerts              → WhatsApp alert history
/parent/notifications       → Notifications
```

---

## KEY IMPLEMENTATION DETAILS

### 1. Appwrite Client Setup:
- Create a singleton Appwrite client config in `/lib/appwrite.ts`
- Server-side: use `ServerClient` for Appwrite Functions
- Client-side: use standard `Client` with `setSession()`
- Store session in httpOnly cookie via Appwrite's `account.createEmailPasswordSession()`

### 2. Data Fetching Pattern:
- Use React Query (TanStack Query) for all data fetching
- Query keys: `['institutes', id]`, `['batches', { instituteId }]`, `['attendance', { batchId, date }]`, etc.
- Stale time: 30 seconds for lists, 5 minutes for dashboards
- Optimistic updates for attendance marking and marks entry

### 3. Attendance Marking UX:
- Load students → render grid → toggle states stored in local `useState` object → Submit button sends batch update
- Show unsaved changes warning if navigating away
- After submit: show success toast + "Sending WhatsApp notifications..." secondary toast
- Disable submit button during save, show spinner

### 4. Marks Entry UX:
- Load students with previous exam marks for reference
- Input fields with `type="number"`, `min={0}`, `max={totalMarks}`
- Live percentage calculation next to each input
- Show batch average and highest/lowest as reference bar
- Validation summary before submit: "X students have invalid marks"

### 5. WhatsApp Send Flow:
- After attendance/marks save succeeds, call Appwrite Function
- Show async status: "Sending 15 WhatsApp notifications..."
- Poll or use real-time subscription to update status
- Failed sends shown in a warning banner with retry option

### 6. Dashboard Data Aggregation:
- For dashboards, fetch raw data from Appwrite and aggregate client-side using `reduce()`
- Cache aggregated data in React Query
- For large datasets, consider Appwrite Functions for server-side aggregation

### 7. CSV Upload:
- Use `papaparse` for parsing
- Show preview table before confirm
- Validate: check all student phones exist, marks are valid numbers
- Show errors inline in table (red row highlight)
- Progress bar during save

### 8. Notifications:
- Real-time: Use Appwrite's `subscribe()` to listen for new documents in `notifications` collection
- Show badge count on bell icon
- Mark as read on click (update document)
- Dropdown panel with latest 5 notifications + "View All" link

### 9. Error Handling:
- Appwrite errors: parse and show user-friendly messages
- Network errors: retry with exponential backoff
- WhatsApp errors: log to `whatsapp_logs`, show admin alert
- Form errors: Zod validation with field-level error messages

### 10. Invite Code System:
- Generate 8-character alphanumeric codes
- Store in a simple `invite_codes` collection: code, institute_id, role, max_uses, used_count, expires_at, is_active
- Validate on signup: code exists, not expired, not exhausted, correct role

---

## WHAT TO BUILD FIRST (Priority Order)

**CRITICAL EXECUTION RULE:**
Do NOT attempt to build the entire project at once. We will build this strictly phase-by-phase. 
Right now, you are only authorized to execute **Phase 1**. 
Provide the folder structure, the Appwrite initialization code, and the auth middleware. Once you have output the code for Phase 1, STOP. Ask me for confirmation to proceed to Phase 2.

### Phase 1 — Core:
1. Appwrite project setup + all collections + indexes
2. Auth flow (login, signup, role detection, middleware)
3. Admin: Institute creation + WhatsApp config + Invite code generation
4. Teacher/Student/Parent signup via invite code
5. Layout: Sidebar, header, role-based routing

### Phase 2 — Teacher Features:
6. Batch management (admin creates, teacher views)
7. Attendance marking (the core feature — make it FAST and smooth)
8. Marks entry (single + bulk CSV)

### Phase 3 — WhatsApp:
9. Appwrite Function for WhatsApp sending
10. Trigger on attendance/marks submit
11. WhatsApp logs + admin analytics

### Phase 4 — Dashboards:
12. Admin dashboard with all charts
13. Teacher analytics dashboard
14. Student dashboard
15. Parent dashboard

### Phase 5 — Polish:
16. Notifications (in-app + real-time)
17. Reports export (CSV)
18. Light/dark theme toggle
19. Mobile responsive
20. Loading skeletons + animations

---

## NON-NEGOTIABLE QUALITY STANDARDS

1. **Every chart must look like it belongs in a paid SaaS product** — not a tutorial demo
2. **Attendance marking must be possible in under 30 seconds for a batch of 30 students**
3. **WhatsApp messages must actually send** — implement the full Meta API call, not a stub
4. **No `any` types in TypeScript** — proper interfaces for all Appwrite documents
5. **Every form must have validation** — no raw submits
6. **Every loading state must have a skeleton** — no blank screens
7. **Responsive** — must work on tablet (teacher's primary device)
8. **No hardcoded data** — everything from Appwrite
9. **Accessible** — proper aria labels, keyboard navigation for attendance/marks grids
10. **Toast for every action** — save, delete, send, error — user must always know what happened

---

## BONUS (implement if time permits)

- **Fee tracking** collection + payment status on student profile
- **Announcement system** — admin sends broadcast → WhatsApp + in-app notification to all
- **Dark/light theme** with smooth transition
- **PWA support** — installable on teacher's phone
- **Offline attendance** — ServiceWorker caches attendance, syncs when online
- **Print-friendly** attendance and marks sheets