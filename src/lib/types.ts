export interface Quest {
  id: string;
  name: string;
  description: string;
  max_points: number;
  order_index: number;
  phase_id: number;
  deliverable_type: string[];
  requirements: string[];
  accepted_formats: string[];
  tips: string[];
  evaluation_criteria: string[];
  status: string;
  started_at: string | null;
  planned_deadline_minutes: number | null;
  late_submission_window_minutes: number | null;
  phase: {
    id: number;
    name: string;
    order_index: number;
  };
}

export interface Team {
  id: string;
  name: string;
  course: string;
  email: string;
  logo_url: string;
}

export interface Submission {
  quest_id: string;
  status: string;
  final_points: number;
}

export interface EventConfig {
  id: string;
  current_phase: number;
  event_started: boolean;
  event_ended: boolean;
  event_start_time: string | null;
  phase_1_start_time: string | null;
  phase_2_start_time: string | null;
  phase_3_start_time: string | null;
  phase_4_start_time: string | null;
  phase_5_start_time: string | null;
}

export interface PhaseControllerProps {
  currentPhase: number
  eventStarted: boolean
}
