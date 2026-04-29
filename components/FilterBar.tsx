import { Member } from '@/types';

interface FilterBarProps {
  members: Member[];
  selectedType: string;
  selectedInstructorId: string;
  onTypeChange: (type: string) => void;
  onInstructorChange: (id: string) => void;
}

export default function FilterBar({
  members,
  selectedType,
  selectedInstructorId,
  onTypeChange,
  onInstructorChange
}: FilterBarProps) {
  const types = ['전체', '강의', '회의', '프로젝트'];

  return (
    <div className="flex flex-col sm:flex-row gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 w-12 shrink-0">분류</label>
        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-primary focus:border-primary block w-40 p-2 shadow-sm outline-none"
        >
          {types.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 w-12 sm:w-auto shrink-0">강사</label>
        <select
          value={selectedInstructorId}
          onChange={(e) => onInstructorChange(e.target.value)}
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-primary focus:border-primary block w-40 p-2 shadow-sm outline-none"
        >
          <option value="all">전체</option>
          {members.map(m => (
            <option key={m.member_id} value={m.member_id}>{m.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
