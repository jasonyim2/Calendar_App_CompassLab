import { useState, useEffect, useMemo } from 'react';
import { Event, Member } from '@/types';

interface EventFormModalProps {
  initialEvent?: Event;
  initialDate?: string;
  members: Member[];
  onClose: () => void;
  onSave: (event: Partial<Event>) => void;
}

const TYPE_OPTIONS = ['강의', '회의', '프로젝트'];
const SUB_TYPE_OPTIONS: Record<string, string[]> = {
  '강의': ['시작', '중간', '마감', '참석', '수주'],
  '회의': ['참석', '시작', '중간', '마감', '수주'],
  '프로젝트': ['수주', '시작', '중간', '마감', '참석'],
};

const AMPM_OPTIONS = ['오전', '오후'];

export default function EventFormModal({ initialEvent, initialDate, members, onClose, onSave }: EventFormModalProps) {
  const [formData, setFormData] = useState<Partial<Event>>({
    type: '강의',
    sub_type: '시작',
    title: '',
    start_date: initialDate || '',
    end_date: initialDate || '',
    start_time: '',
    duration_h: '',
    member_ids: '',
    client: '',
    location: '',
    notes: '',
  });

  const [ampm, setAmpm] = useState('오전');
  const [hhmm, setHhmm] = useState('09:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialEvent) {
      setFormData(initialEvent);
      if (initialEvent.start_time) {
        const parts = initialEvent.start_time.split(' ');
        if (parts.length === 2) {
          setAmpm(parts[0]);
          setHhmm(parts[1]);
        }
      }
    }
  }, [initialEvent]);

  const hhmmOptions = useMemo(() => {
    const opts = [];
    for (let h = 1; h <= 12; h++) {
      const hStr = h.toString().padStart(2, '0');
      opts.push(`${hStr}:00`);
      opts.push(`${hStr}:30`);
    }
    return opts;
  }, []);

  const handleChange = (field: keyof Event, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'type') {
        const defaultSub = SUB_TYPE_OPTIONS[value]?.[0] || '시작';
        next.sub_type = defaultSub;
      }
      if (field === 'start_date') {
        next.end_date = value;
      }
      return next;
    });
  };

  const handleMemberToggle = (id: string) => {
    const currentIds = formData.member_ids ? formData.member_ids.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (currentIds.includes(id)) {
      handleChange('member_ids', currentIds.filter(i => i !== id).join(','));
    } else {
      handleChange('member_ids', [...currentIds, id].join(','));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!formData.start_date) {
      alert("시작일을 선택해주세요.");
      return;
    }
    if (!formData.member_ids) {
      alert("최소 한 명의 강사를 선택해주세요.");
      return;
    }

    const payload = { ...formData };
    if (!payload.end_date) {
      payload.end_date = payload.start_date;
    }
    if (payload.start_date && payload.end_date && payload.start_date > payload.end_date) {
      alert("종료일은 시작일보다 빠를 수 없습니다.");
      return;
    }

    if (payload.type === '강의' || payload.type === '회의') {
      payload.start_time = `${ampm} ${hhmm}`;
    } else {
      payload.start_time = '';
      payload.duration_h = '';
    }

    setIsSubmitting(true);
    try {
      await onSave(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMemberIds = formData.member_ids ? formData.member_ids.split(',').map(s => s.trim()).filter(Boolean) : [];
  const showTimeFields = formData.type === '강의' || formData.type === '회의';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {initialEvent ? '일정 수정' : '새 일정 추가'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <form id="event-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
                <select 
                  value={formData.type} 
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-primary focus:border-primary p-2.5 outline-none"
                >
                  {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상세 분류</label>
                <select 
                  value={formData.sub_type} 
                  onChange={(e) => handleChange('sub_type', e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-primary focus:border-primary p-2.5 outline-none"
                >
                  {(SUB_TYPE_OPTIONS[formData.type || '강의'] || []).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목 <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.title} 
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="일정 제목을 입력하세요"
                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-primary focus:border-primary p-2.5 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작일 <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  value={formData.start_date} 
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-primary focus:border-primary p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료일 <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  value={formData.end_date} 
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-primary focus:border-primary p-2.5 outline-none"
                />
              </div>
            </div>

            {showTimeFields && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
                  <div className="flex gap-2">
                    <select 
                      value={ampm} 
                      onChange={(e) => setAmpm(e.target.value)}
                      className="bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-primary focus:border-primary p-2.5 outline-none flex-1"
                    >
                      {AMPM_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <select 
                      value={hhmm} 
                      onChange={(e) => setHhmm(e.target.value)}
                      className="bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-primary focus:border-primary p-2.5 outline-none flex-[2]"
                    >
                      {hhmmOptions.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">소요 시간 (시간)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0"
                    value={formData.duration_h} 
                    onChange={(e) => handleChange('duration_h', e.target.value)}
                    placeholder="예: 2"
                    className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-primary focus:border-primary p-2.5 outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">강사 <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {members.map(m => (
                  <label key={m.member_id} className="cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="peer sr-only" 
                      checked={selectedMemberIds.includes(m.member_id)}
                      onChange={() => handleMemberToggle(m.member_id)}
                    />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 peer-checked:border-[var(--primary)] peer-checked:bg-blue-50 peer-checked:text-[var(--primary)] transition-colors">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }}></span>
                      {m.name}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">고객사</label>
                <input 
                  type="text" 
                  value={formData.client} 
                  onChange={(e) => handleChange('client', e.target.value)}
                  placeholder="고객사 이름"
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-primary focus:border-primary p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">장소 / 링크</label>
                <input 
                  type="text" 
                  value={formData.location} 
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="주소 또는 화상회의 링크"
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-primary focus:border-primary p-2.5 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
              <textarea 
                value={formData.notes} 
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="추가 메모를 입력하세요"
                rows={3}
                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-primary focus:border-primary p-2.5 outline-none resize-none"
              />
            </div>
          </form>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
          <button 
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button 
            type="submit"
            form="event-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-blue-900 rounded-md shadow-sm transition-colors flex items-center justify-center min-w-[64px]"
          >
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
