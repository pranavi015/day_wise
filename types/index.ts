export type Intensity = "relaxed" | "balanced" | "intense";
export type TaskType = "learning" | "review";

export interface Topic {
  id: string;
  name: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimated_minutes: number;
}

export interface Task {
  id: string;
  topic_id: string;
  topic_name: string;
  title: string;
  duration_minutes: number;
  type: TaskType;
  is_complete: boolean;
  scheduled_date: string;
}

export interface OnboardingState {
  topics: Topic[];
  daily_hours: number;
  weekly_varies: boolean;
  per_day_hours: Record<string, number>;
  exception_days: string[];
  intensity: Intensity;
  sr_enabled: boolean;
  has_deadline?: boolean;
  exam_date?: string;
}

export interface ProgressLog {
  date: string;
  tasks_planned: number;
  tasks_completed: number;
  minutes_planned: number;
  minutes_spent: number;
  streak_count: number;
}
