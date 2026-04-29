export interface Member {
  member_id: string;
  name: string;
  email: string;
  color: string;
  is_active: boolean;
}

export interface Event {
  event_id: string;
  type: string;       // 강의 | 회의 | 프로젝트
  sub_type: string;   // 수주 | 참석 | 시작 | 중간 | 마감
  title: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  start_time: string; // 오전 09:00, 오후 14:00 (only for 강의/회의)
  duration_h: string; // number in hours string format, only for 강의/회의
  member_ids: string; // comma-separated
  client: string;
  location: string;
  notes: string;
}
