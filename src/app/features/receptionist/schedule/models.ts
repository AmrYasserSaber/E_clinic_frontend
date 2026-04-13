export interface DoctorOption {
  id: number;
  name: string;
  specialty?: string;
}

export interface DoctorScheduleDay {
  day_of_week: number;
  is_working_day: boolean;
  start_time: string;
  end_time: string;
  session_duration_minutes: 15 | 30 | 45 | 60;
  buffer_minutes: 0 | 5 | 10 | 15;
}

export interface ScheduleException {
  id: number;
  start_date: string;
  end_date?: string | null;
  exception_type: 'DAY_OFF' | 'CUSTOM_WORKING_DAY';
  custom_start_time?: string | null;
  custom_end_time?: string | null;
  reason?: string;
}

export interface AddScheduleExceptionPayload {
  start_date: string;
  end_date?: string | null;
  exception_type: 'DAY_OFF' | 'CUSTOM_WORKING_DAY';
  custom_start_time?: string | null;
  custom_end_time?: string | null;
  reason?: string;
}
