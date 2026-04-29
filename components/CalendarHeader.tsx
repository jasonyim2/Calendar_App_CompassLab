import { format, parseISO, addMonths, subMonths, isBefore, isAfter } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CalendarHeaderProps {
  currentMonth: string; // YYYY-MM
  onChange: (newMonth: string) => void;
}

export default function CalendarHeader({ currentMonth, onChange }: CalendarHeaderProps) {
  const date = parseISO(`${currentMonth}-01`);
  
  const minDate = parseISO('2026-01-01');
  const maxDate = parseISO('2040-12-01');

  const handlePrev = () => {
    const prev = subMonths(date, 1);
    if (!isBefore(prev, minDate)) {
      onChange(format(prev, 'yyyy-MM'));
    }
  };

  const handleNext = () => {
    const next = addMonths(date, 1);
    if (!isAfter(next, maxDate)) {
      onChange(format(next, 'yyyy-MM'));
    }
  };

  const prevDisabled = isBefore(subMonths(date, 1), minDate);
  const nextDisabled = isAfter(addMonths(date, 1), maxDate);

  return (
    <div className="flex items-center justify-between py-4 px-6 bg-white border-b border-gray-200">
      <button 
        onClick={handlePrev} 
        disabled={prevDisabled}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-primary transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <h2 className="text-2xl font-bold text-gray-800">
        {format(date, 'yyyy년 M월', { locale: ko })}
      </h2>
      <button 
        onClick={handleNext} 
        disabled={nextDisabled}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-primary transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}
