// ===========================================
// EduFox — Core Type Definitions
// ===========================================

// -------------------------------------------
// Database Enums
// -------------------------------------------
export type UserRole = 'student' | 'admin';

export type Skill = 'reading' | 'listening' | 'writing' | 'speaking';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type ContentStatus = 'draft' | 'published' | 'archived';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'cancelled'
  | 'expired'
  | 'pending';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

export type AttemptStatus =
  | 'in_progress'
  | 'submitted'
  | 'scored'
  | 'expired';

export type VocabularyMastery =
  | 'new'
  | 'learning'
  | 'review'
  | 'mastered';

export type WritingTaskType = 'task_1' | 'task_2';

export type SpeakingPart = 1 | 2 | 3;

// -------------------------------------------
// Question Types
// -------------------------------------------
export type QuestionType =
  | 'multiple_choice'
  | 'multiple_select'
  | 'multiple_response'
  | 'true_false_not_given'
  | 'yes_no_not_given'
  | 'matching_headings'
  | 'matching_information'
  | 'matching_features'
  | 'matching_sentence_endings'
  | 'sentence_completion'
  | 'summary_completion'
  | 'note_completion'
  | 'table_completion'
  | 'flow_chart_completion'
  | 'diagram_label_completion'
  | 'short_answer'
  | 'plan_map_diagram'
  | 'form_completion'
  | 'writing_task_1'
  | 'writing_task_2'
  | 'speaking_part_1'
  | 'speaking_part_2'
  | 'speaking_part_3';

// -------------------------------------------
// Database Models
// -------------------------------------------
export interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  target_band: number | null;
  challenges: string[];
  plan_timeline: string | null;
  has_taken_ielts: boolean;
  previous_score: number | null;
  estimated_level: string | null;
  onboarding_completed: boolean;
  role: UserRole;
  status?: string;
  telegram_id?: number | null;
  telegram_username?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  provider: string;
  provider_subscription_id: string | null;
  started_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  plan?: Plan;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  provider_payment_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// -------------------------------------------
// Test & Questions
// -------------------------------------------
export interface Test {
  id: string;
  title: string;
  slug?: string | null;
  description: string | null;
  skill: Skill | 'mock';
  ielts_type?: 'academic' | 'general_training' | 'both';
  access_type?: 'free' | 'premium';
  difficulty: Difficulty;
  is_premium: boolean;
  cover_image?: string | null;
  tags?: string[];
  status: ContentStatus;
  time_limit_minutes: number;
  total_questions: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  sections?: TestSection[];
}

export interface TestSection {
  id: string;
  test_id: string;
  title: string;
  order_number: number;
  instructions: string | null;
  time_limit_minutes: number | null;
  created_at: string;
  updated_at: string;
  questions?: Question[];
}

export interface QuestionTypeConfig {
  id: string;
  name: string;
  slug: QuestionType;
  skill: Skill | null;
  description: string | null;
  schema_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  test_id: string;
  section_id: string;
  question_type_id: string;
  question_type: QuestionType;
  question_number: number;
  instruction: string | null;
  question_text: string;
  passage_id: string | null;
  media_id: string | null;
  points: number;
  difficulty: Difficulty;
  metadata: Record<string, unknown>;
  explanation: string | null;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  options?: QuestionOption[];
  group_id?: string | null;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  option_key: string;
  is_correct: boolean; // Only available server-side / after submission
  order_number: number;
}

export interface QuestionGroup {
  id: string;
  section_id: string;
  title: string | null;
  instruction: string | null;
  passage_id: string | null;
  order_number: number;
}

// -------------------------------------------
// Reading
// -------------------------------------------
export interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  source: string | null;
  word_count: number;
  difficulty: Difficulty;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

// -------------------------------------------
// Listening
// -------------------------------------------
export interface ListeningAudio {
  id: string;
  title: string;
  file_path: string;
  duration_seconds: number;
  transcript: string | null;
  is_premium: boolean;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

// -------------------------------------------
// Writing
// -------------------------------------------
export interface WritingPrompt {
  id: string;
  task_type: WritingTaskType;
  title: string;
  prompt_text: string;
  image_url: string | null;
  difficulty: Difficulty;
  is_premium: boolean;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface WritingSubmission {
  id: string;
  user_id: string;
  prompt_id: string;
  content: string;
  word_count: number;
  status: 'draft' | 'submitted' | 'reviewed';
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  prompt?: WritingPrompt;
  feedback?: WritingFeedback | null;
}

export interface WritingFeedback {
  id: string;
  submission_id: string;
  task_achievement: number;
  coherence_cohesion: number;
  lexical_resource: number;
  grammatical_range: number;
  estimated_band: number;
  feedback_text: string;
  is_ai_generated: boolean;
  created_at: string;
}

// -------------------------------------------
// Speaking
// -------------------------------------------
export interface SpeakingPrompt {
  id: string;
  part_number: SpeakingPart;
  title: string;
  prompt_text: string;
  follow_up_questions: string[];
  difficulty: Difficulty;
  is_premium: boolean;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface SpeakingSubmission {
  id: string;
  user_id: string;
  prompt_id: string;
  audio_path: string;
  duration_seconds: number;
  transcript: string | null;
  status: 'submitted' | 'reviewed';
  created_at: string;
  updated_at: string;
  prompt?: SpeakingPrompt;
  feedback?: SpeakingFeedback | null;
}

export interface SpeakingFeedback {
  id: string;
  submission_id: string;
  fluency_coherence: number;
  lexical_resource: number;
  grammatical_range: number;
  pronunciation: number;
  estimated_band: number;
  feedback_text: string;
  is_ai_generated: boolean;
  created_at: string;
}

// -------------------------------------------
// Test Attempts
// -------------------------------------------
export interface TestAttempt {
  id: string;
  user_id: string;
  test_id: string;
  status: AttemptStatus;
  started_at: string;
  submitted_at: string | null;
  time_used_seconds: number | null;
  raw_score: number | null;
  total_points: number | null;
  estimated_band: number | null;
  created_at: string;
  updated_at: string;
  test?: Test;
  answers?: AttemptAnswer[];
  scores?: SectionScore[];
}

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  user_answer: string | string[];
  is_correct: boolean | null;
  points_earned: number;
  answered_at: string | null;
  marked_for_review: boolean;
}

export interface SectionScore {
  id: string;
  attempt_id: string;
  section_id: string;
  raw_score: number;
  total_points: number;
  estimated_band: number | null;
}

// -------------------------------------------
// Vocabulary
// -------------------------------------------
export interface VocabularyWord {
  id: string;
  word: string;
  definition: string;
  example_sentence: string | null;
  pronunciation: string | null;
  part_of_speech: string | null;
  topic: string;
  difficulty: Difficulty;
  is_premium: boolean;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface UserVocabulary {
  id: string;
  user_id: string;
  word_id: string;
  status: VocabularyMastery;
  mastery_level: number;
  next_review_at: string | null;
  review_count: number;
  created_at: string;
  updated_at: string;
  word?: VocabularyWord;
}

// -------------------------------------------
// Progress
// -------------------------------------------
export interface Progress {
  id: string;
  user_id: string;
  skill: Skill;
  score: number;
  estimated_band: number | null;
  recorded_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string | null;
  earned_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// -------------------------------------------
// Admin
// -------------------------------------------
export interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
  updated_by: string | null;
}

// -------------------------------------------
// Notifications
// -------------------------------------------
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  link?: string | null;
  created_at: string;
}

// -------------------------------------------
// Band Score Mapping
// -------------------------------------------
export interface BandScoreMapping {
  id: string;
  skill: Skill;
  test_type: string;
  raw_score_min: number;
  raw_score_max: number;
  band_score: number;
}

// -------------------------------------------
// Dashboard Stats
// -------------------------------------------
export interface DashboardStats {
  target_band: number | null;
  estimated_band: number | null;
  practice_streak: number;
  vocabulary_progress: {
    total: number;
    mastered: number;
    learning: number;
  };
  skill_progress: {
    reading: SkillProgress;
    listening: SkillProgress;
    writing: SkillProgress;
    speaking: SkillProgress;
  };
  recent_activity: ActivityLog[];
}

export interface SkillProgress {
  latest_score: number | null;
  estimated_band: number | null;
  tests_completed: number;
  target_band: number | null;
}

// -------------------------------------------
// Admin Dashboard Stats
// -------------------------------------------
export interface AdminDashboardStats {
  total_users: number;
  new_users_today: number;
  active_users: number;
  premium_users: number;
  free_users: number;
  total_revenue: number;
  completed_tests: number;
  average_score: number | null;
  popular_modules: { skill: Skill; count: number }[];
  conversion_rate: number;
}

// -------------------------------------------
// Saved Items
// -------------------------------------------
export interface SavedItem {
  id: string;
  user_id: string;
  item_type: 'question' | 'vocabulary' | 'writing' | 'speaking';
  item_id: string;
  created_at: string;
}
