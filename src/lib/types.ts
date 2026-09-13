export interface Profile {
  id: string;
  auth_user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  source_file_path?: string;
  total_questions: number;
  total_marks: number;
  duration_seconds: number;
  negative_marking: number;
  allow_navigation: boolean;
  status: "draft" | "processing" | "ready" | "disabled";
  created_at: string;
  updated_at: string;
  sections?: ExamSection[];
  attempt_count?: number;
  best_score?: number;
}

export interface ExamSection {
  id: string;
  exam_id: string;
  name: string;
  section_order: number;
  start_question: number;
  end_question: number;
  duration_seconds?: number;
}

export interface Question {
  id: string;
  exam_id: string;
  section_id?: string;
  question_number: number;
  question_text?: string;
  question_type: "single_choice" | "multiple_choice";
  correct_answer: string[];
  marks: number;
  negative_marks: number;
  question_image_url?: string;
  question_image_alt?: string;
  source_page?: number;
  created_at: string;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_key: string;
  option_text?: string;
  option_image_url?: string;
  option_order: number;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  user_id: string;
  status: "in_progress" | "submitted" | "expired";
  started_at: string;
  submitted_at?: string;
  current_section?: number;
  current_question?: number;
  time_remaining_seconds?: number;
}

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_answer: string[];
  is_marked_review: boolean;
  saved_at: string;
}

export interface ExamResult {
  id: string;
  attempt_id: string;
  total_score: number;
  max_score: number;
  percentage: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  accuracy: number;
  time_taken_seconds: number;
  created_at: string;
  section_results?: SectionResult[];
}

export interface SectionResult {
  id: string;
  result_id: string;
  section_id: string;
  section_name: string;
  score: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
}

export interface ProcessingJob {
  id: string;
  user_id: string;
  exam_id?: string;
  source_file_path: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  questions_found: number;
  answers_found: number;
  sections_found: number;
  images_found: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
}

export interface AIProvider {
  id: string;
  name: string;
  provider_type: string;
  base_url: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIModel {
  id: string;
  provider_id: string;
  model_id: string;
  display_name: string;
  enabled: boolean;
}

export interface AIConfiguration {
  id: string;
  provider_id: string;
  model_id: string;
  is_active: boolean;
  last_tested_at?: string;
  provider?: AIProvider;
  model?: AIModel;
}
