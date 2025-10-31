export interface Project {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TimeSlot {
  id: string;
  project_id: string;
  date: string;
  time_slot: number; // The 15-minute slot (e.g., 9.0, 9.25, 9.5, 9.75, 10.0)
  note?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserSettings {
  id: string;
  day_start_hour: number;
  day_end_hour: number;
  stats_start_date?: string | null;
  stats_end_date?: string | null;
  created_at?: string;
  updated_at?: string;
}
