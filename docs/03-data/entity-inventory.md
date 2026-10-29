# Entity Inventory and Catalog

This catalog documents the complete inventory of 23 conceptual and logical relational entities comprising the **FSD-SDG-4 Quality Education SaaS** data model.

---

| # | Entity Name | Description | Tenant-Scoped? | Primary Key | Key Attributes / Natural Keys | Parent / Owning Entity | Lifecycle / Mutability |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| **1** | `School` | The tenant root record representing an educational institution. | **Root Tenant** | UUID | `name`, `code`, `subdomain`, `contact_email`, `status` | Platform Root | Mutable; Soft Deletable |
| **2** | `User` | Authenticated system account. | Yes (`school_id`) | UUID | `email`, `password_hash`, `role`, `status`, `last_login_at` | `School` | Mutable; Soft Deletable |
| **3** | `Session` | Server-managed login session. | Yes (`school_id`) | UUID | `token_hash`, `expires_at`, `ip_address`, `user_agent` | `User` | Expiring; Deletable on logout |
| **4** | `AcademicYear` | Institutional academic calendar period. | Yes (`school_id`) | UUID | `name`, `start_date`, `end_date`, `status` (ACTIVE/ARCHIVED) | `School` | Mutable until Archived |
| **5** | `Class` | Grade level (e.g. Grade 8, Form 2). | Yes (`school_id`) | UUID | `name`, `stage`, `sort_order` | `School` | Mutable |
| **6** | `Section` | Classroom cohort within a Class. | Yes (`school_id`) | UUID | `name`, `capacity`, `room_number` | `Class` & `AcademicYear` | Mutable |
| **7** | `Subject` | Academic curriculum discipline. | Yes (`school_id`) | UUID | `name`, `code`, `description`, `credits` | `School` | Mutable |
| **8** | `CourseOffering` | Scheduled offering linking subject, section, and teacher. | Yes (`school_id`) | UUID | `academic_year_id`, `section_id`, `subject_id`, `syllabus` | `Section` & `Subject` | Mutable |
| **9** | `CourseTeacher` | Join table associating teachers with course offerings. | Yes (`school_id`) | UUID | `course_offering_id`, `teacher_id`, `role` (PRIMARY/ASSISTANT)| `CourseOffering` | Mutable |
| **10**| `StudentProfile` | Demographic profile of a learner. | Yes (`school_id`) | UUID | `student_id_number`, `first_name`, `last_name`, `dob`, `gender` | `User` | Mutable |
| **11**| `TeacherProfile` | Professional profile of an educator. | Yes (`school_id`) | UUID | `employee_id`, `first_name`, `last_name`, `specialization` | `User` | Mutable |
| **12**| `Enrollment` | Enrollment of a student in a section for an academic year. | Yes (`school_id`) | UUID | `student_id`, `section_id`, `academic_year_id`, `status` | `StudentProfile` | Mutable |
| **13**| `GuardianRel` | Association between guardian and student (P1). | Yes (`school_id`) | UUID | `guardian_user_id`, `student_id`, `relationship_type` | `User` & `StudentProfile` | Mutable |
| **14**| `AttendanceRecord` | Daily attendance entry for a student in a section. | Yes (`school_id`) | UUID | `student_id`, `section_id`, `date`, `status`, `remarks` | `Section` | Mutable (5-day window) |
| **15**| `LearningResource` | Curated instructional material or document. | Yes (`school_id`) | UUID | `course_offering_id`, `title`, `type`, `url`, `file_key`, `status` | `CourseOffering` | Mutable |
| **16**| `Assignment` | Coursework task assigned to students. | Yes (`school_id`) | UUID | `course_offering_id`, `title`, `instructions`, `max_points`, `due_date`| `CourseOffering` | Mutable |
| **17**| `AssignmentSubmission`| Student's completed coursework submission. | Yes (`school_id`) | UUID | `assignment_id`, `student_id`, `submitted_at`, `status`, `content` | `Assignment` | Mutable until graded |
| **18**| `Assessment` | Formal examination or term test. | Yes (`school_id`) | UUID | `course_offering_id`, `title`, `weight_percentage`, `max_marks` | `CourseOffering` | Mutable |
| **19**| `AssessmentResult` | Student's grade on a formal assessment. | Yes (`school_id`) | UUID | `assessment_id`, `student_id`, `score`, `grade_letter`, `notes` | `Assessment` | Mutable (Audit logged) |
| **20**| `Feedback` | Qualitative feedback on submission or assessment. | Yes (`school_id`) | UUID | `submission_id`, `assessment_result_id`, `author_id`, `comment` | Polymorphic Parent | Mutable |
| **21**| `ProgressSnapshot` | Longitudinal performance aggregation. | Yes (`school_id`) | UUID | `student_id`, `period_start`, `period_end`, `attendance_rate`, `gpa` | `StudentProfile` | Read-only Snapshot |
| **22**| `SupportFlag` | Explainable advisory early warning flag. | Yes (`school_id`) | UUID | `student_id`, `flag_type`, `severity`, `rationale`, `status` | `StudentProfile` | State Machine |
| **23**| `SupportPlan` | Structured remedial intervention case. | Yes (`school_id`) | UUID | `student_id`, `lead_teacher_id`, `target_goal`, `review_date`, `status`| `StudentProfile` | Active Lifecycle |
| **24**| `SupportPlanAction` | Discrete action item inside a support plan. | Yes (`school_id`) | UUID | `support_plan_id`, `description`, `assignee_id`, `due_date`, `status` | `SupportPlan` | Mutable |
| **25**| `SupportReview` | Milestone review of support plan outcome. | Yes (`school_id`) | UUID | `support_plan_id`, `review_date`, `outcome_status`, `notes` | `SupportPlan` | Append-only Milestone |
| **26**| `AuditLog` | System security and mutation audit record. | Yes (`school_id`) | UUID | `actor_id`, `action`, `entity_type`, `entity_id`, `delta`, `ip_addr` | `School` | **Immutable Append-Only** |
