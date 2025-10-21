export interface Project {
  id: string;
  name: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

export interface TimeEntry {
  id: string;
  project_id: string;
  date: string;
  start_time: number;
  end_time: number;
  created_at?: string;
  updated_at?: string;
}

export interface TimeBlock {
  start: number;
  end: number;
  projectId?: string;
}

export interface UserSettings {
  id: string;
  day_start_hour: number;
  day_end_hour: number;
  time_increment: 15 | 30 | 60;
  created_at?: string;
  updated_at?: string;
}
