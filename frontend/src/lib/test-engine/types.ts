export type SkillType = 'reading' | 'listening' | 'writing' | 'speaking';
export type QuestionCategory = 
  | 'multiple_choice' | 'multiple_select' | 'true_false_not_given' | 'yes_no_not_given'
  | 'matching' | 'matching_headings' | 'matching_information' | 'matching_features' | 'matching_sentence_endings'
  | 'sentence_completion' | 'summary_completion' | 'note_completion' | 'table_completion'
  | 'flow_chart_completion' | 'diagram_label_completion' | 'short_answer' | 'plan_map_diagram' | 'form_completion';

export interface Test {
  id: string;
  title: string;
  slug?: string;
  description: string | null;
  skill: SkillType;
  time_limit_minutes: number;
  sections: TestSection[];
}

export interface TestSection {
  id: string;
  title: string;
  order_number: number;
  instructions: string | null;
  groups: QuestionGroup[];
}

export interface QuestionGroup {
  id: string;
  title: string | null;
  instruction: string | null;
  passage?: ReadingPassage;
  media?: ListeningAudio;
  questions: Question[];
}

export interface ReadingPassage {
  id: string;
  title: string;
  content: string; // HTML or Markdown
}

export interface ListeningAudio {
  id: string;
  title: string;
  file_path: string;
}

export interface Question {
  id: string;
  question_type: QuestionCategory;
  question_number: number;
  instruction: string | null;
  question_text: string;
  options?: QuestionOption[];
  points?: number;
  correct_answer?: string | null;
  accepted_answers?: string[] | null;
  explanation?: string | null;
}

export interface QuestionOption {
  id: string;
  option_key: string;
  option_text: string;
}

export interface TestAttempt {
  id: string;
  test_id: string;
  status: 'in_progress' | 'submitted' | 'scored' | 'expired';
  started_at: string;
  answers: Record<string, string | string[]>; // Map question_id -> user answer(s)
  marked_for_review: string[]; // Array of question_ids
}
