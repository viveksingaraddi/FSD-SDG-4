-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED');

-- CreateEnum
CREATE TYPE "AcademicYearStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CourseTeacherRole" AS ENUM ('PRIMARY', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'TRANSFERRED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'WITHDRAWN', 'COMPLETED');

-- CreateEnum
CREATE TYPE "GuardianRelationshipType" AS ENUM ('MOTHER', 'FATHER', 'LEGAL_GUARDIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('TEXT_GUIDE', 'EXTERNAL_LINK', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED', 'LATE', 'GRADED');

-- CreateEnum
CREATE TYPE "SupportFlagType" AS ENUM ('ATTENDANCE_RISK', 'ACADEMIC_ENGAGEMENT_RISK', 'ACADEMIC_MASTERY_RISK');

-- CreateEnum
CREATE TYPE "SupportSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "SupportFlagStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'DISMISSED', 'IN_PLAN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "SupportPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RESOLVED', 'ESCALATED', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "ActionItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupportReviewOutcome" AS ENUM ('RESOLVED', 'CONTINUED', 'ESCALATED');

-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "subdomain" VARCHAR(64) NOT NULL,
    "contact_email" VARCHAR(255) NOT NULL,
    "status" "SchoolStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "school_id" UUID,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "school_id" UUID,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(512),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "AcademicYearStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "stage" VARCHAR(64) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "capacity" INTEGER,
    "room_number" VARCHAR(32),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "description" VARCHAR(500),
    "credits" DECIMAL(4,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_offerings" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "syllabus" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "course_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_teachers" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "course_offering_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "role" "CourseTeacherRole" NOT NULL DEFAULT 'PRIMARY',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_profiles" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "employee_id" VARCHAR(64) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "specialization" VARCHAR(150),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "student_id_number" VARCHAR(64) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE,
    "gender" VARCHAR(32),
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "admission_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardian_relationships" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "guardian_user_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "relationship_type" "GuardianRelationshipType" NOT NULL,
    "is_primary_contact" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "guardian_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "recorded_by_id" UUID NOT NULL,
    "attendance_date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "late_minutes" INTEGER,
    "remarks" VARCHAR(500),
    "amendment_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_resources" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "course_offering_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "resource_type" "ResourceType" NOT NULL,
    "url" VARCHAR(1024),
    "file_key" VARCHAR(512),
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "learning_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "course_offering_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "instructions" TEXT NOT NULL,
    "max_points" DECIMAL(6,2) NOT NULL,
    "due_date" TIMESTAMPTZ(6) NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_submissions" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "graded_by_id" UUID,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "content" TEXT,
    "file_key" VARCHAR(512),
    "score" DECIMAL(6,2),
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "graded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "course_offering_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "assessment_date" DATE NOT NULL,
    "weight_percentage" DECIMAL(5,2) NOT NULL,
    "max_marks" DECIMAL(6,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_results" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "recorded_by_id" UUID NOT NULL,
    "score" DECIMAL(6,2) NOT NULL,
    "grade_letter" VARCHAR(8),
    "notes" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "assessment_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "submission_id" UUID,
    "assessment_result_id" UUID,
    "author_id" UUID NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_snapshots" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "attendance_rate" DECIMAL(5,2) NOT NULL,
    "assignment_completion_rate" DECIMAL(5,2) NOT NULL,
    "weighted_average_score" DECIMAL(5,2),
    "computed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_plans" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "lead_teacher_id" UUID NOT NULL,
    "problem_summary" TEXT NOT NULL,
    "target_goal" TEXT NOT NULL,
    "review_date" DATE NOT NULL,
    "status" "SupportPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "support_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_flags" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "reviewed_by_id" UUID,
    "support_plan_id" UUID,
    "flag_type" "SupportFlagType" NOT NULL,
    "severity" "SupportSeverity" NOT NULL,
    "rationale" TEXT NOT NULL,
    "status" "SupportFlagStatus" NOT NULL DEFAULT 'PROPOSED',
    "dismissal_reason" TEXT,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "support_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_plan_actions" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "support_plan_id" UUID NOT NULL,
    "assignee_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "ActionItemStatus" NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "support_plan_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_reviews" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "support_plan_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "review_date" DATE NOT NULL,
    "outcome_status" "SupportReviewOutcome" NOT NULL,
    "notes" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "school_id" UUID,
    "actor_id" UUID,
    "action" VARCHAR(120) NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" UUID NOT NULL,
    "delta" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_code_key" ON "schools"("code");

-- CreateIndex
CREATE UNIQUE INDEX "schools_subdomain_key" ON "schools"("subdomain");

-- CreateIndex
CREATE INDEX "schools_status_idx" ON "schools"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_school_id_role_status_idx" ON "users"("school_id", "role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "users_school_id_id_key" ON "users"("school_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_expires_at_idx" ON "sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "sessions_school_id_expires_at_idx" ON "sessions"("school_id", "expires_at");

-- CreateIndex
CREATE INDEX "academic_years_school_id_status_idx" ON "academic_years"("school_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_school_id_id_key" ON "academic_years"("school_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_school_id_name_key" ON "academic_years"("school_id", "name");

-- CreateIndex
CREATE INDEX "classes_school_id_sort_order_idx" ON "classes"("school_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "classes_school_id_id_key" ON "classes"("school_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "classes_school_id_name_key" ON "classes"("school_id", "name");

-- CreateIndex
CREATE INDEX "sections_school_id_academic_year_id_idx" ON "sections"("school_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "sections_school_id_class_id_idx" ON "sections"("school_id", "class_id");

-- CreateIndex
CREATE UNIQUE INDEX "sections_school_id_id_key" ON "sections"("school_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "sections_school_id_academic_year_id_class_id_name_key" ON "sections"("school_id", "academic_year_id", "class_id", "name");

-- CreateIndex
CREATE INDEX "subjects_school_id_name_idx" ON "subjects"("school_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_school_id_id_key" ON "subjects"("school_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_school_id_code_key" ON "subjects"("school_id", "code");

-- CreateIndex
CREATE INDEX "course_offerings_school_id_section_id_idx" ON "course_offerings"("school_id", "section_id");

-- CreateIndex
CREATE INDEX "course_offerings_school_id_subject_id_idx" ON "course_offerings"("school_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_offerings_school_id_id_key" ON "course_offerings"("school_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "course_offerings_school_id_academic_year_id_section_id_subj_key" ON "course_offerings"("school_id", "academic_year_id", "section_id", "subject_id");

-- CreateIndex
CREATE INDEX "course_teachers_school_id_teacher_id_idx" ON "course_teachers"("school_id", "teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_teachers_school_id_course_offering_id_teacher_id_key" ON "course_teachers"("school_id", "course_offering_id", "teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_user_id_key" ON "teacher_profiles"("user_id");

-- CreateIndex
CREATE INDEX "teacher_profiles_school_id_last_name_first_name_idx" ON "teacher_profiles"("school_id", "last_name", "first_name");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_school_id_id_key" ON "teacher_profiles"("school_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_school_id_user_id_key" ON "teacher_profiles"("school_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_school_id_employee_id_key" ON "teacher_profiles"("school_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");

-- CreateIndex
CREATE INDEX "student_profiles_school_id_status_last_name_first_name_idx" ON "student_profiles"("school_id", "status", "last_name", "first_name");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_school_id_id_key" ON "student_profiles"("school_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_school_id_user_id_key" ON "student_profiles"("school_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_school_id_student_id_number_key" ON "student_profiles"("school_id", "student_id_number");

-- CreateIndex
CREATE INDEX "enrollments_school_id_section_id_status_idx" ON "enrollments"("school_id", "section_id", "status");

-- CreateIndex
CREATE INDEX "enrollments_school_id_academic_year_id_idx" ON "enrollments"("school_id", "academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_school_id_student_id_academic_year_id_key" ON "enrollments"("school_id", "student_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "guardian_relationships_school_id_student_id_idx" ON "guardian_relationships"("school_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "guardian_relationships_school_id_guardian_user_id_student_i_key" ON "guardian_relationships"("school_id", "guardian_user_id", "student_id");

-- CreateIndex
CREATE INDEX "attendance_records_school_id_section_id_attendance_date_idx" ON "attendance_records"("school_id", "section_id", "attendance_date");

-- CreateIndex
CREATE INDEX "attendance_records_school_id_student_id_attendance_date_idx" ON "attendance_records"("school_id", "student_id", "attendance_date");

-- CreateIndex
CREATE INDEX "attendance_records_school_id_recorded_by_id_idx" ON "attendance_records"("school_id", "recorded_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_school_id_section_id_student_id_attendan_key" ON "attendance_records"("school_id", "section_id", "student_id", "attendance_date");

-- CreateIndex
CREATE INDEX "learning_resources_school_id_course_offering_id_status_idx" ON "learning_resources"("school_id", "course_offering_id", "status");

-- CreateIndex
CREATE INDEX "learning_resources_school_id_created_by_id_idx" ON "learning_resources"("school_id", "created_by_id");

-- CreateIndex
CREATE INDEX "assignments_school_id_course_offering_id_due_date_idx" ON "assignments"("school_id", "course_offering_id", "due_date");

-- CreateIndex
CREATE INDEX "assignments_school_id_created_by_id_idx" ON "assignments"("school_id", "created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "assignments_school_id_id_key" ON "assignments"("school_id", "id");

-- CreateIndex
CREATE INDEX "assignment_submissions_school_id_assignment_id_status_idx" ON "assignment_submissions"("school_id", "assignment_id", "status");

-- CreateIndex
CREATE INDEX "assignment_submissions_school_id_student_id_idx" ON "assignment_submissions"("school_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submissions_school_id_id_key" ON "assignment_submissions"("school_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submissions_school_id_assignment_id_student_id_key" ON "assignment_submissions"("school_id", "assignment_id", "student_id");

-- CreateIndex
CREATE INDEX "assessments_school_id_course_offering_id_assessment_date_idx" ON "assessments"("school_id", "course_offering_id", "assessment_date");

-- CreateIndex
CREATE INDEX "assessments_school_id_created_by_id_idx" ON "assessments"("school_id", "created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessments_school_id_id_key" ON "assessments"("school_id", "id");

-- CreateIndex
CREATE INDEX "assessment_results_school_id_assessment_id_idx" ON "assessment_results"("school_id", "assessment_id");

-- CreateIndex
CREATE INDEX "assessment_results_school_id_student_id_idx" ON "assessment_results"("school_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_results_school_id_id_key" ON "assessment_results"("school_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_results_school_id_assessment_id_student_id_key" ON "assessment_results"("school_id", "assessment_id", "student_id");

-- CreateIndex
CREATE INDEX "feedbacks_school_id_submission_id_idx" ON "feedbacks"("school_id", "submission_id");

-- CreateIndex
CREATE INDEX "feedbacks_school_id_assessment_result_id_idx" ON "feedbacks"("school_id", "assessment_result_id");

-- CreateIndex
CREATE INDEX "feedbacks_school_id_author_id_idx" ON "feedbacks"("school_id", "author_id");

-- CreateIndex
CREATE INDEX "progress_snapshots_school_id_student_id_period_end_idx" ON "progress_snapshots"("school_id", "student_id", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "progress_snapshots_school_id_student_id_academic_year_id_pe_key" ON "progress_snapshots"("school_id", "student_id", "academic_year_id", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "support_plans_school_id_student_id_status_idx" ON "support_plans"("school_id", "student_id", "status");

-- CreateIndex
CREATE INDEX "support_plans_school_id_lead_teacher_id_status_idx" ON "support_plans"("school_id", "lead_teacher_id", "status");

-- CreateIndex
CREATE INDEX "support_plans_school_id_review_date_idx" ON "support_plans"("school_id", "review_date");

-- CreateIndex
CREATE UNIQUE INDEX "support_plans_school_id_id_key" ON "support_plans"("school_id", "id");

-- CreateIndex
CREATE INDEX "support_flags_school_id_status_created_at_idx" ON "support_flags"("school_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "support_flags_school_id_student_id_status_idx" ON "support_flags"("school_id", "student_id", "status");

-- CreateIndex
CREATE INDEX "support_flags_school_id_support_plan_id_idx" ON "support_flags"("school_id", "support_plan_id");

-- CreateIndex
CREATE INDEX "support_plan_actions_school_id_support_plan_id_status_idx" ON "support_plan_actions"("school_id", "support_plan_id", "status");

-- CreateIndex
CREATE INDEX "support_plan_actions_school_id_assignee_id_due_date_idx" ON "support_plan_actions"("school_id", "assignee_id", "due_date");

-- CreateIndex
CREATE INDEX "support_reviews_school_id_support_plan_id_review_date_idx" ON "support_reviews"("school_id", "support_plan_id", "review_date");

-- CreateIndex
CREATE INDEX "support_reviews_school_id_reviewer_id_idx" ON "support_reviews"("school_id", "reviewer_id");

-- CreateIndex
CREATE INDEX "audit_logs_school_id_created_at_idx" ON "audit_logs"("school_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_school_id_entity_type_entity_id_idx" ON "audit_logs"("school_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_school_id_class_id_fkey" FOREIGN KEY ("school_id", "class_id") REFERENCES "classes"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_school_id_academic_year_id_fkey" FOREIGN KEY ("school_id", "academic_year_id") REFERENCES "academic_years"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_school_id_academic_year_id_fkey" FOREIGN KEY ("school_id", "academic_year_id") REFERENCES "academic_years"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_school_id_section_id_fkey" FOREIGN KEY ("school_id", "section_id") REFERENCES "sections"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_school_id_subject_id_fkey" FOREIGN KEY ("school_id", "subject_id") REFERENCES "subjects"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_teachers" ADD CONSTRAINT "course_teachers_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_teachers" ADD CONSTRAINT "course_teachers_school_id_course_offering_id_fkey" FOREIGN KEY ("school_id", "course_offering_id") REFERENCES "course_offerings"("school_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_teachers" ADD CONSTRAINT "course_teachers_school_id_teacher_id_fkey" FOREIGN KEY ("school_id", "teacher_id") REFERENCES "teacher_profiles"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_school_id_user_id_fkey" FOREIGN KEY ("school_id", "user_id") REFERENCES "users"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_school_id_user_id_fkey" FOREIGN KEY ("school_id", "user_id") REFERENCES "users"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_school_id_student_id_fkey" FOREIGN KEY ("school_id", "student_id") REFERENCES "student_profiles"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_school_id_section_id_fkey" FOREIGN KEY ("school_id", "section_id") REFERENCES "sections"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_school_id_academic_year_id_fkey" FOREIGN KEY ("school_id", "academic_year_id") REFERENCES "academic_years"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardian_relationships" ADD CONSTRAINT "guardian_relationships_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardian_relationships" ADD CONSTRAINT "guardian_relationships_school_id_guardian_user_id_fkey" FOREIGN KEY ("school_id", "guardian_user_id") REFERENCES "users"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardian_relationships" ADD CONSTRAINT "guardian_relationships_school_id_student_id_fkey" FOREIGN KEY ("school_id", "student_id") REFERENCES "student_profiles"("school_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_school_id_section_id_fkey" FOREIGN KEY ("school_id", "section_id") REFERENCES "sections"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_school_id_student_id_fkey" FOREIGN KEY ("school_id", "student_id") REFERENCES "student_profiles"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_school_id_recorded_by_id_fkey" FOREIGN KEY ("school_id", "recorded_by_id") REFERENCES "users"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_school_id_course_offering_id_fkey" FOREIGN KEY ("school_id", "course_offering_id") REFERENCES "course_offerings"("school_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_school_id_created_by_id_fkey" FOREIGN KEY ("school_id", "created_by_id") REFERENCES "users"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_school_id_course_offering_id_fkey" FOREIGN KEY ("school_id", "course_offering_id") REFERENCES "course_offerings"("school_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_school_id_created_by_id_fkey" FOREIGN KEY ("school_id", "created_by_id") REFERENCES "users"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_school_id_assignment_id_fkey" FOREIGN KEY ("school_id", "assignment_id") REFERENCES "assignments"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_school_id_student_id_fkey" FOREIGN KEY ("school_id", "student_id") REFERENCES "student_profiles"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_school_id_graded_by_id_fkey" FOREIGN KEY ("school_id", "graded_by_id") REFERENCES "users"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_school_id_course_offering_id_fkey" FOREIGN KEY ("school_id", "course_offering_id") REFERENCES "course_offerings"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_school_id_created_by_id_fkey" FOREIGN KEY ("school_id", "created_by_id") REFERENCES "users"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_school_id_assessment_id_fkey" FOREIGN KEY ("school_id", "assessment_id") REFERENCES "assessments"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_school_id_student_id_fkey" FOREIGN KEY ("school_id", "student_id") REFERENCES "student_profiles"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_school_id_recorded_by_id_fkey" FOREIGN KEY ("school_id", "recorded_by_id") REFERENCES "users"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_school_id_submission_id_fkey" FOREIGN KEY ("school_id", "submission_id") REFERENCES "assignment_submissions"("school_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_school_id_assessment_result_id_fkey" FOREIGN KEY ("school_id", "assessment_result_id") REFERENCES "assessment_results"("school_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_school_id_author_id_fkey" FOREIGN KEY ("school_id", "author_id") REFERENCES "users"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_snapshots" ADD CONSTRAINT "progress_snapshots_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_snapshots" ADD CONSTRAINT "progress_snapshots_school_id_student_id_fkey" FOREIGN KEY ("school_id", "student_id") REFERENCES "student_profiles"("school_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_snapshots" ADD CONSTRAINT "progress_snapshots_school_id_academic_year_id_fkey" FOREIGN KEY ("school_id", "academic_year_id") REFERENCES "academic_years"("school_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_plans" ADD CONSTRAINT "support_plans_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_plans" ADD CONSTRAINT "support_plans_school_id_student_id_fkey" FOREIGN KEY ("school_id", "student_id") REFERENCES "student_profiles"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_plans" ADD CONSTRAINT "support_plans_school_id_lead_teacher_id_fkey" FOREIGN KEY ("school_id", "lead_teacher_id") REFERENCES "users"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_flags" ADD CONSTRAINT "support_flags_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_flags" ADD CONSTRAINT "support_flags_school_id_student_id_fkey" FOREIGN KEY ("school_id", "student_id") REFERENCES "student_profiles"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_flags" ADD CONSTRAINT "support_flags_school_id_reviewed_by_id_fkey" FOREIGN KEY ("school_id", "reviewed_by_id") REFERENCES "users"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_flags" ADD CONSTRAINT "support_flags_school_id_support_plan_id_fkey" FOREIGN KEY ("school_id", "support_plan_id") REFERENCES "support_plans"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_plan_actions" ADD CONSTRAINT "support_plan_actions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_plan_actions" ADD CONSTRAINT "support_plan_actions_school_id_support_plan_id_fkey" FOREIGN KEY ("school_id", "support_plan_id") REFERENCES "support_plans"("school_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_plan_actions" ADD CONSTRAINT "support_plan_actions_school_id_assignee_id_fkey" FOREIGN KEY ("school_id", "assignee_id") REFERENCES "users"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_reviews" ADD CONSTRAINT "support_reviews_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_reviews" ADD CONSTRAINT "support_reviews_school_id_support_plan_id_fkey" FOREIGN KEY ("school_id", "support_plan_id") REFERENCES "support_plans"("school_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_reviews" ADD CONSTRAINT "support_reviews_school_id_reviewer_id_fkey" FOREIGN KEY ("school_id", "reviewer_id") REFERENCES "users"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- POSTGRESQL CHECK CONSTRAINTS & PARTIAL INDEXES (Phase 5 Integrity Hardening)
-- ============================================================================

-- 1. Enforce SUPER_ADMIN has NULL school_id while all school-scoped roles have non-NULL school_id
ALTER TABLE "users"
  ADD CONSTRAINT "chk_users_role_school_id"
  CHECK (
    (role = 'SUPER_ADMIN' AND school_id IS NULL)
    OR (role <> 'SUPER_ADMIN' AND school_id IS NOT NULL)
  );

-- 2. BR-SCH-001: Academic year date validity and at most one ACTIVE academic year per school
ALTER TABLE "academic_years"
  ADD CONSTRAINT "chk_academic_years_dates"
  CHECK (end_date > start_date);

CREATE UNIQUE INDEX "uq_academic_years_one_active_per_school"
  ON "academic_years" ("school_id")
  WHERE status = 'ACTIVE';

-- 3. Positive section capacity when specified
ALTER TABLE "sections"
  ADD CONSTRAINT "chk_sections_capacity_positive"
  CHECK (capacity IS NULL OR capacity > 0);

-- 4. Positive late minutes when specified on attendance records
ALTER TABLE "attendance_records"
  ADD CONSTRAINT "chk_attendance_late_minutes_positive"
  CHECK (late_minutes IS NULL OR late_minutes > 0);

-- 5. Positive max points on assignments and non-negative scores on submissions
ALTER TABLE "assignments"
  ADD CONSTRAINT "chk_assignments_max_points_positive"
  CHECK (max_points > 0);

ALTER TABLE "assignment_submissions"
  ADD CONSTRAINT "chk_submissions_score_non_negative"
  CHECK (score IS NULL OR score >= 0);

-- 6. Assessment weight and marks bounds
ALTER TABLE "assessments"
  ADD CONSTRAINT "chk_assessments_bounds"
  CHECK (max_marks > 0 AND weight_percentage >= 0 AND weight_percentage <= 100);

ALTER TABLE "assessment_results"
  ADD CONSTRAINT "chk_assessment_results_score_non_negative"
  CHECK (score >= 0);

-- 7. Feedback must belong to exactly one parent (submission OR assessment_result, never both or neither)
ALTER TABLE "feedbacks"
  ADD CONSTRAINT "chk_feedbacks_single_parent"
  CHECK (
    (submission_id IS NOT NULL AND assessment_result_id IS NULL)
    OR (submission_id IS NULL AND assessment_result_id IS NOT NULL)
  );

-- 8. Progress snapshot period and percentage bounds
ALTER TABLE "progress_snapshots"
  ADD CONSTRAINT "chk_progress_snapshots_bounds"
  CHECK (
    period_end >= period_start
    AND attendance_rate >= 0 AND attendance_rate <= 100
    AND assignment_completion_rate >= 0 AND assignment_completion_rate <= 100
  );

-- 9. BR-REV-002: Dismissed support flags require a dismissal reason of at least 10 non-whitespace characters
ALTER TABLE "support_flags"
  ADD CONSTRAINT "chk_support_flags_dismissal_reason"
  CHECK (
    status <> 'DISMISSED'
    OR (dismissal_reason IS NOT NULL AND char_length(btrim(dismissal_reason)) >= 10)
  );

-- 10. Partial index for pending support flag triage queue
CREATE INDEX "idx_support_flags_proposed_partial"
  ON "support_flags" ("school_id", "created_at" DESC)
  WHERE status = 'PROPOSED';
