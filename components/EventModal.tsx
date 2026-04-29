import { useState, useEffect } from 'react';
import { Event, Member } from '@/types';

interface EventModalProps {
  event: Event;
  members: Member[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function EventModal({ event, members, onClose, onEdit, onDelete }: EventModalProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const memberIds = event.member_ids ? event.member_ids.split(',').map(id => id.trim()) : [];
  const eventMembers = members.filter(m => memberIds.includes(m.member_id));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showConfirm) {
        setShowConfirm(false);
        e.stopPropagation();
      }
    };

    if (showConfirm) {
      window.addEventListener('keydown', handleKeyDown, true);
    }
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showConfirm]);

  const handleDelete = () => {
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    onDelete();
  };

  const getBadgeColor = (type: string) => {
    if (type === '강의') return 'bg-blue-100 text-blue-800';
    if (type === '회의') return 'bg-green-100 text-green-800';
    if (type === '프로젝트') return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] relative">
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900 break-words pr-4">{event.title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex gap-2 mb-6">
            <span className={`px-2.5 py-0.5 rounded text-sm font-medium ${getBadgeColor(event.type)}`}>
              {event.type}
            </span>
            {event.sub_type && (
              <span className="px-2.5 py-0.5 rounded text-sm font-medium bg-gray-100 text-gray-800">
                {event.sub_type}
              </span>
            )}
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex gap-3 items-start">
              <span className="font-semibold text-gray-700 w-16 shrink-0 pt-0.5">일시</span>
              <div>
                <div className="text-gray-900 font-medium">
                  {event.start_date} {event.start_date !== event.end_date ? `~ ${event.end_date}` : ''}
                </div>
                {(event.type === '강의' || event.type === '회의') && event.start_time && (
                  <div className="text-gray-600 mt-1">
                    {event.start_time} ({event.duration_h}시간)
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="font-semibold text-gray-700 w-16 shrink-0 pt-1.5">강사</span>
              <div className="flex flex-wrap gap-2">
                {eventMembers.length > 0 ? eventMembers.map(m => (
                  <div key={m.member_id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }}></span>
                    <span className="text-gray-800 font-medium">{m.name}</span>
                  </div>
                )) : <span className="text-gray-500 pt-1.5">지정되지 않음</span>}
              </div>
            </div>

            {event.client && (
              <div className="flex gap-3 items-start">
                <span className="font-semibold text-gray-700 w-16 shrink-0 pt-0.5">고객사</span>
                <span className="text-gray-800 break-words pt-0.5">{event.client}</span>
              </div>
            )}

            {event.location && (
              <div className="flex gap-3 items-start">
                <span className="font-semibold text-gray-700 w-16 shrink-0 pt-0.5">장소</span>
                <div className="pt-0.5">
                  {event.location.startsWith('http') ? (
                    <a href={event.location} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                      {event.location}
                    </a>
                  ) : (
                    <span className="text-gray-800 break-words">{event.location}</span>
                  )}
                </div>
              </div>
            )}

            {event.notes && (
              <div className="flex gap-3 items-start">
                <span className="font-semibold text-gray-700 w-16 shrink-0 pt-0.5">비고</span>
                <p className="text-gray-800 whitespace-pre-wrap break-words pt-0.5">{event.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
          <button 
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] hover:bg-red-800 rounded-md shadow-sm transition-colors"
          >
            삭제
          </button>
          <button 
            onClick={onEdit}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-blue-900 rounded-md shadow-sm transition-colors"
          >
            수정
          </button>
        </div>

        {/* Delete Confirm Overlay */}
        {showConfirm && (
          <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-72 text-center flex flex-col items-center">
              <h3 className="text-lg font-bold text-gray-900 mb-6">정말 삭제하시겠습니까?</h3>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#C00000' }}
                >
                  예, 삭제합니다
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
