# Smart Student Hub API Guide

This document lists and describes all API endpoints defined in `server/routes.ts`.

- Base URL: relative to your server host, e.g. `http://localhost:<port>`
- JSON is the default request/response format unless stated otherwise.
- Authentication uses an HTTP-only cookie named `token` (JWT). See Auth section.
- Many routes require role-based authorization and additional domain checks.

## Conventions
- "Auth" indicates if the endpoint requires a valid JWT cookie. If Yes, include role constraints.
- Path params are shown as `:param`.
- Query params are provided after `?`.
- Types are illustrative. ObjectId is a MongoDB identifier string unless otherwise noted.

---

## Authentication

### POST /api/register
- Auth: No
- Body (JSON):
  - `name: string` (required)
  - `email: string` (required)
  - `password: string` (required)
  - `role: 'student' | 'faculty' | 'hod' | 'principal' | 'shiksan_mantri'` (default: `'student'`)
  - `department: string` (required if role is `student`) – department identifier or name as used by your storage
- Response: 201 Created
  - Sets `token` cookie
  - JSON: `{ _id, name, email, role, department }`

### POST /api/login
- Auth: No
- Body (JSON):
  - `email: string`
  - `password: string`
- Response: 200 OK
  - Sets `token` cookie
  - JSON: `{ _id, name, email, role, department }`

### POST /api/logout
- Auth: No
- Response: 200 OK `{ message }`
  - Clears `token` cookie

### GET /api/user
- Auth: Optional (optionalAuth)
- Response: 200 OK or 401 if unauthenticated
  - `{ _id, name, email, role, department, profile }`

### POST /api/reset-password
- Auth: No
- Body (JSON):
  - `token: string` (reset token issued on account creation)
  - `password: string`
- Response: 200 OK `{ message }`

---

## Users and Roles

### GET /api/users/faculty
- Auth: Yes (role: `hod`)
- Response: 200 OK Array of faculty users (password excluded)

### GET /api/users/students
- Auth: Yes (role: `hod`)
- Response: 200 OK Array of student users in HOD's department and college

### GET /api/users/students-all
- Auth: Yes (role: `faculty`)
- Response: 200 OK Array of all student users

### POST /api/users/create-faculty
- Auth: Yes (role: `hod`)
- Body (JSON):
  - `name: string` (required)
  - `email: string` (required)
- Behavior: Creates faculty user in HOD's department and college, sets reset token (logged to console)
- Response: 201 Created `{ message, user }`

### POST /api/users/create-principal
- Auth: Yes (role: `shiksan_mantri`)
- Body (JSON):
  - `name: string`
  - `email: string`
  - `collegeId?: ObjectId` (optional)
- Response: 201 Created `{ message, user }` (reset URL logged to console)

### POST /api/users/create-hod
- Auth: Yes (role: `principal`)
- Body (JSON):
  - `name: string`
  - `email: string`
  - `departmentId: ObjectId` (must belong to principal's college)
- Response: 201 Created `{ message, user }`

### POST /api/users/create-student
- Auth: Yes (role: `hod`)
- Body (JSON):
  - `name: string`
  - `email: string`
  - `semester?: number | string`
  - `course?: string`
  - `batch?: string`
  - `department?: ObjectId | string` (defaults to HOD's)
- Behavior: Creates `User` and a `Profile` linked to user; sets reset token (console)
- Response: 201 Created `{ message, user: { ... , profile: {...} } }`

### GET /api/users/students/classroom/:classroomId
- Auth: Yes
- Params:
  - `classroomId: ObjectId`
- Response: 200 OK Array of students in classroom (or `[]`)

### GET /api/users/department/:departmentId
- Auth: Yes (roles: `faculty`, `hod`)
- Params:
  - `departmentId: ObjectId`
- Response: 200 OK Array of users with role `student` within department

### DELETE /api/users/:id
- Auth: Yes (role: `hod`)
- Params:
  - `id: ObjectId` (user id)
- Behavior: HOD may delete only users in their own department
- Response: 200 OK `{ message }`

### POST /api/follow/:userId
- Auth: Yes (role: `student`)
- Params:
  - `userId: ObjectId` (target user)
- Response: 200 OK `{ message }` or errors if invalid/self

---

## Profile

### GET /api/profile
- Auth: Yes
- Response: 200 OK Profile object

### PUT /api/profile
- Auth: Yes
- Body: arbitrary profile fields to update
- Response: 200 OK Updated profile

---

## Achievements

### GET /api/achievements
- Auth: Yes
- Ownership check: `checkOwnership` allows students to access own data; faculty/hod can filter via `studentFilter` if provided by middleware
- Query:
  - `status?: 'pending' | 'approved' | 'rejected'`
  - `category?: string`
  - `type?: string`
- Response: 200 OK Array of achievements

### GET /api/achievements/:id
- Auth: Yes
- Params: `id: ObjectId`
- Behavior: Students may only access their own achievement
- Response: 200 OK Achievement or 404/403

### POST /api/achievements
- Auth: Yes (role: `student`)
- Upload: multipart/form-data handled by `uploadAchievementFiles`
- Body (form fields):
  - `title: string` (required)
  - `description: string` (required)
  - `category?: string`
  - `type?: string`
  - Files:
    - `certificate?: file` (single)
    - `media?: file[]` (images/videos)
- Response: 201 Created Achievement with stored file URLs (served at `/uploads/...`)

### PUT /api/achievements/:id/status
- Auth: Yes (roles: `faculty`, `hod`)
- Body (JSON):
  - `status: 'approved' | 'rejected'`
  - `comment?: string`
- Behavior: If approved, attempts QR code generation and attaches `qrCodePath`
- Response: 200 OK Updated achievement

### POST /api/achievements/:id/comments
- Auth: Yes
- Body (JSON):
  - `text: string`
- Response: 200 OK Updated achievement with appended comment

### POST /api/achievements/:id/like
- Auth: Yes
- Behavior: Toggle like for current user
- Response: 200 OK Updated achievement

### GET /verify/:id
- Public
- Params: `id: ObjectId` (achievement id)
- Response: 200 OK `{ title, description, student, verifiedAt, status }` if approved; 404 otherwise

### GET /uploads/*
- Auth: Yes
- Behavior: Serves uploaded files from `uploads/` directory

---

## Dynamic Forms

### GET /api/forms
- Auth: Yes (roles: `faculty`, `hod`)
- Response: 200 OK Array of dynamic forms

### GET /api/student/forms
- Auth: Yes (role: `student`)
- Response: 200 OK Array of forms visible to students

### GET /api/forms/:id
- Auth: Yes
- Params: `id: ObjectId`
- Response: 200 OK Form

### POST /api/forms
- Auth: Yes (roles: `faculty`, `hod`)
- Body: form definition JSON
  - Common fields include `title`, `description`, `fields`, visibility windows, etc. (as supported by your storage layer)
- Response: 201 Created Form

### PUT /api/forms/:id
- Auth: Yes (roles: `faculty`, `hod`)
- Body: partial form update
- Response: 200 OK Updated form

### DELETE /api/forms/:id
- Auth: Yes (roles: `faculty`, `hod`)
- Response: 200 OK `{ message }`

### POST /api/forms/:id/submit
- Auth: Yes (role: `student`)
- Upload: multipart/form-data handled by `formUpload`
- Params: `id: ObjectId`
- Body: field values keyed by field id; file fields become `file.path`
- Response: 201 Created `{ message }`

### GET /api/forms/:id/submissions
- Auth: Yes (roles: `faculty`, `hod`)
- Params: `id: ObjectId`
- Behavior: Only the form creator may view
- Response: 200 OK Form with submissions

### GET /api/forms/:id/submissions/download
- Auth: Yes (roles: `faculty`, `hod`)
- Params: `id: ObjectId`
- Behavior: Only the form creator may download
- Response: 200 OK (Content-Type: application/zip). A ZIP containing:
  - `form_data.json`
  - `submissions.csv`
  - Uploaded files organized by student and field

---

## Classroom & Students

### GET /api/students/classroom/:classroomId
- Auth: Yes (role: `faculty`)
- Params: `classroomId: ObjectId`
- Response: 200 OK Array of students in classroom

---

## Colleges, Departments, HODs

### POST /api/colleges
- Auth: Yes (role: `shiksan_mantri`)
- Body (JSON):
  - `name: string`
  - `address?: string`
  - `principal: ObjectId` (user id)
- Behavior: Also updates the principal user with college id
- Response: 201 Created College

### GET /api/colleges
- Auth: Yes (roles: `shiksan_mantri`, `principal`)
- Response: 200 OK Array of colleges

### GET /api/colleges/:id
- Auth: Yes (roles: `shiksan_mantri`, `principal`)
- Params: `id: ObjectId`
- Response: 200 OK College details including departments, HODs, and users grouped by roles

### GET /api/principal/college
- Auth: Yes (role: `principal`)
- Response: 200 OK College associated with the principal

### POST /api/departments
- Auth: Yes (role: `principal`)
- Body (JSON):
  - `name: string`
  - `hod?: ObjectId`
  - `collegeId: ObjectId` (must match principal's college)
- Response: 201 Created Department

### POST /api/create-department
- Auth: Yes (role: `principal`)
- Body (JSON):
  - `departmentName: string`
  - `hodName: string`
  - `hodEmail: string`
- Behavior: Creates department and HOD user, sets reset token, links HOD to department
- Response: 201 Created `{ department, hod }`

### POST /api/departments/create
- Auth: Yes (role: `principal`)
- Body (JSON):
  - `name: string`
- Behavior: Creates department in principal's college if name unique
- Response: 201 Created `{ message, department }`

### GET /api/departments/principal
- Auth: Yes (role: `principal`)
- Response: 200 OK Array of departments in principal's college, populated with HOD

### GET /api/hods/principal
- Auth: Yes (role: `principal`)
- Response: 200 OK Array of HOD users in principal's college

---

## Subjects

### POST /api/subjects
- Auth: Yes (roles: `hod`, `faculty`)
- Body (JSON):
  - `name: string`
  - `classroom: ObjectId`
- Behavior: Subject is scoped to creator's department; `faculty` field is auto-set to current user
- Response: 201 Created Subject

### GET /api/subjects
- Auth: Yes
- Behavior: 
  - `hod`: subjects created by HOD
  - `faculty`/`student`: subjects in user's department
  - Others: all subjects
- Response: 200 OK Array of subjects

### GET /api/subjects/faculty/:facultyId
- Auth: Yes
- Params: `facultyId: ObjectId`
- Response: 200 OK Array of subjects taught by specified faculty

- Note: There is also an internal debug route missing a leading slash `GET api/faculty/:facultyId` that mirrors the same functionality. Prefer using `/api/subjects/faculty/:facultyId`.

---

## Timetables

### POST /api/timetables
- Auth: Yes (role: `hod`)
- Body (JSON):
  - `semester: number | string`
  - `schedule: Array<{ day: string, startTime: string, endTime: string, subject: ObjectId, classroom: ObjectId, faculty: ObjectId }>`
- Behavior: Enforces uniqueness per department+semester; validates schedule
- Response: 201 Created Timetable (populated fields)

### GET /api/timetables/department/:departmentId
- Auth: Yes
- Params: `departmentId: ObjectId`
- Response: 200 OK Array of timetables for department (populated)

### GET /api/timetables/student
- Auth: Yes (role: `student`)
- Behavior: Uses student's department and optional `profile.semester` for filtering
- Response: 200 OK Array of timetables

---

## Attendance (HOD scoped and general export)

### GET /api/attendance/excel
- Variant A (earlier in file):
  - Auth: Yes (role: `hod`)
  - Query: `subjectId?: ObjectId | 'all'`
  - Response: 200 OK Array of row objects suitable for Excel export with student/subject names and attendance status
- Variant B (later in file):
  - Auth: Yes (ownership checked by `checkOwnership`)
  - Query: `subjectId?: ObjectId | 'all'`
  - Response: 200 OK Array of row objects
- Note: Route is defined twice with different middlewares. Behavior may vary by registration order.

### GET /api/attendance/all
- Not directly present; instead, HOD receives normalized attendance via the first `/api/attendance/excel` block and related queries constructed within that section.

---

## Analytics & Admin

### GET /api/analytics
- Auth: Yes (role: `hod`)
- Response: 200 OK Analytics object

### GET /api/admin/compass
- Auth: Yes (role: `hod`)
- Response: 200 OK `{ uriRedacted, note, docs, download }`

---

## Circuits Module (EC/EE Departments)

Department restrictions are enforced by `checkDepartment` and comparison with the current user's department.

### POST /api/circuit/problems
- Auth: Yes (roles: `faculty`, `hod`)
- Body (JSON): `title: string`, `description: string`
- Response: 201 Created `{ _id, title, description, department, createdAt, updatedAt }`

### GET /api/circuit/problems
- Auth: Yes (EC/EE related departments)
- Response: 200 OK Array of problems in user's department

### GET /api/circuit/problems/:id
- Auth: Yes (EC/EE related departments)
- Params: `id: ObjectId`
- Behavior: Must belong to user's department
- Response: 200 OK Problem

### POST /api/circuit/problems/:id/submit
- Auth: Yes (role: `student`, EC/EE departments)
- Params: `id: ObjectId`
- Body (JSON): `design: any` (required), `notes?: string`
- Response: 201 Created `{ _id, createdAt }`

### GET /api/circuit/problems/:id/submissions
- Auth: Yes (roles: `faculty`, `hod`, EC/EE departments)
- Params: `id: ObjectId` (problem id)
- Response: 200 OK Array of submissions with student info

### GET /api/circuit/submissions/:submissionId/pdf
- Auth: Yes (roles: `faculty`, `hod`, EC/EE departments)
- Params: `submissionId: ObjectId`
- Response: 200 OK PDF download of the submission

---

## Quiz Module (Mechanical Department)

Department restrictions are enforced similarly to Circuits but for Mechanical (`me`, `mechanical`).

### POST /api/quiz
- Auth: Yes (roles: `faculty`, `hod` in Mechanical)
- Body (JSON): `title: string`, `description?: string`, `questions: Array<{ text: string, options: string[], correctIndex: number }>`
- Response: 201 Created `{ _id, title, department }`

### GET /api/quiz
- Auth: Yes (Mechanical department)
- Response: 200 OK Array of quizzes

### GET /api/quiz/:id
- Auth: Yes (Mechanical department)
- Params: `id: ObjectId`
- Response: 200 OK Quiz. For students: hides correctIndex values.

### POST /api/quiz/:id/submit
- Auth: Yes (role: `student`, Mechanical department)
- Body (JSON): `answers: number[]` (length must match questions)
- Response: 201 Created `{ _id, score }` or 400 with existing score if already submitted

### GET /api/quiz/:id/submissions
- Auth: Yes (roles: `faculty`, `hod`, Mechanical department)
- Response: 200 OK Array of submissions with student info

### GET /api/quiz/:id/my-submission
- Auth: Yes (role: `student`, Mechanical department)
- Response: 200 OK `{ _id, score, createdAt, answers }`

---

## Resumes

### GET /api/resumes
- Auth: Yes
- Response: 200 OK Array of the current user's resumes

### POST /api/resumes
- Auth: Yes
- Body (JSON):
  - `template: 1 | 2 | 3`
  - `data: object` (resume content)
- Response: 201 Created `{ _id, template, data, createdAt, updatedAt }`

### POST /api/resumes/suggest
- Auth: Yes
- Body (JSON): `summary?: string`, `skills?: string[]`, `experience?: any[]`, `education?: any[]`
- Behavior: Uses Google Gemini API; requires `GEMINI_API_KEY` env var.
- Response: 200 OK Suggested content JSON

---

## Contact Authority (Student)

### POST /api/contact-authority
- Auth: Yes (role: `student`)
- Body (JSON):
  - `recipientRole: 'hod' | 'principal' | 'shiksan_mantri'`
  - `message: string`
- Behavior: Resolves recipient email based on student's department/college or global role and logs the message to server console
- Response: 200 OK `{ message }`

---

## LeetCode, Stock, Business (Mounted Routers)

These are mounted sub-routers. Refer to their respective files for full details:
- `app.use('/api/leetcode/problems', problemRoutes)` => LeetCode problems endpoints under `/api/leetcode/problems/*`
- `app.use('/api/leetcode/submissions', submissionRoutes)` => LeetCode submissions under `/api/leetcode/submissions/*`
- `app.use('/api/leetcode', badgeRoutes)` => Likely badge/stat endpoints under `/api/leetcode/*`
- `app.use('/api/stock', stockRoutes)` => Stock trading endpoints under `/api/stock/*`
- `app.use('/api/business/problems', businessProblemRoutes)` => Business problem endpoints under `/api/business/problems/*`

---

## Admin and Misc

### GET /api/analytics
- See Analytics section above (HOD only)

### GET /api/admin/compass
- See Admin section above (HOD only)

---

## Notes & Constraints
- Cookies: JWT token is set with `httpOnly`, and `sameSite` depends on environment. In production, `secure` and `sameSite='none'` are used.
- Many endpoints assume relationships between User, Profile, College, Department, Classroom, Subject, etc. Ensure these are created and linked properly.
- File uploads are stored locally and served via `/uploads/*` with authentication.
- Duplicate route definitions:
  - `/api/attendance/excel` appears twice with different middlewares; earlier registration typically wins precedence.
  - There is a route missing a leading slash: `GET api/faculty/:facultyId` intended for querying subjects by faculty. Use `/api/subjects/faculty/:facultyId` instead.

---

## Quick Parameter Examples
- Create Student (HOD): `POST /api/users/create-student`
  - Body: `{ "name": "John Doe", "email": "john@example.com", "semester": 3, "course": "CSE", "batch": "2024", "department": "<deptId>" }`
- Submit Achievement (Student): `POST /api/achievements`
  - Form fields: `title=Hackathon Winner`, `description=Won XYZ`, files: `certificate=<file>`, `media=<files...>`
- Create Subject (Faculty/HOD): `POST /api/subjects`  
  - Body: `{ "name": "Signals", "classroom": "<classroomId>" }`
- Create Timetable (HOD): `POST /api/timetables`
  - Body: `{ "semester": 5, "schedule": [ { "day": "Mon", "startTime": "10:00", "endTime": "11:00", "subject": "<subjectId>", "classroom": "<classroomId>", "faculty": "<facultyId>" } ] }`

