import { Event, Member } from '@/types';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, format, isSameMonth, isToday, 
  parseISO, differenceInDays 
} from 'date-fns';
import { ko } from 'date-fns/locale';

interface CalendarGridProps {
  currentMonth: string; // YYYY-MM
  events: Event[];
  members: Member[];
  onDateClick: (date: string) => void;
  onEventClick: (event: Event) => void;
}

export default function CalendarGrid({ currentMonth, events, members, onDateClick, onEventClick }: CalendarGridProps) {
  const monthDate = parseISO(`${currentMonth}-01`);
  const startDate = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 }); // 월요일 시작
  const endDate = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getEventBackground = (memberIdsStr: string) => {
    if (!memberIdsStr) return '#9ca3af'; // gray-400
    const ids = memberIdsStr.split(',').map(id => id.trim());
    const eventMembers = members.filter(m => ids.includes(m.member_id));
    if (eventMembers.length === 0) return '#9ca3af';
    if (eventMembers.length === 1) return eventMembers[0].color;
    
    // Gradient
    const stops = eventMembers.map((m, i) => {
      const startPct = (i / eventMembers.length) * 100;
      const endPct = ((i + 1) / eventMembers.length) * 100;
      return `${m.color} ${startPct}%, ${m.color} ${endPct}%`;
    }).join(', ');
    
    return `linear-gradient(90deg, ${stops})`;
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-200 gap-[1px]">
      <div className="grid grid-cols-7 bg-white text-center">
        {['월', '화', '수', '목', '금', '토', '일'].map((day, i) => (
          <div key={day} className={`py-2 text-sm font-semibold border-b border-gray-200 ${i === 5 ? 'text-blue-600' : i === 6 ? 'text-red-600' : 'text-gray-700'}`}>
            {day}
          </div>
        ))}
      </div>

      {weeks.map((week, wIdx) => {
        const weekStrStart = format(week[0], 'yyyy-MM-dd');
        const weekStrEnd = format(week[6], 'yyyy-MM-dd');

        // Events spanning this week
        const weekEvents = events.filter(e => {
          return e.start_date <= weekStrEnd && e.end_date >= weekStrStart;
        }).sort((a, b) => {
          // Sort by start date, then duration
          if (a.start_date !== b.start_date) return a.start_date.localeCompare(b.start_date);
          const aDur = differenceInDays(parseISO(a.end_date), parseISO(a.start_date));
          const bDur = differenceInDays(parseISO(b.end_date), parseISO(b.start_date));
          return bDur - aDur; // longer events first
        });

        const rows: Event[][] = [];
        const eventLayouts = weekEvents.map(event => {
          const actualStart = event.start_date < weekStrStart ? weekStrStart : event.start_date;
          const actualEnd = event.end_date > weekStrEnd ? weekStrEnd : event.end_date;
          
          const startCol = week.findIndex(d => format(d, 'yyyy-MM-dd') === actualStart);
          const endCol = week.findIndex(d => format(d, 'yyyy-MM-dd') === actualEnd);
          const colSpan = endCol - startCol + 1;

          let rowIndex = 0;
          while (true) {
            if (!rows[rowIndex]) rows[rowIndex] = [];
            let overlap = false;
            for (let i = startCol; i <= endCol; i++) {
              if (rows[rowIndex][i]) {
                overlap = true;
                break;
              }
            }
            if (!overlap) {
              for (let i = startCol; i <= endCol; i++) {
                rows[rowIndex][i] = event;
              }
              break;
            }
            rowIndex++;
          }

          const isStart = event.start_date >= weekStrStart;
          const isEnd = event.end_date <= weekStrEnd;

          return { event, startCol, colSpan, rowIndex, isStart, isEnd };
        });

        const weekMinHeight = Math.max(70, 32 + rows.length * 28);

        return (
          <div key={wIdx} className="grid grid-cols-7 flex-1 bg-white relative" style={{ minHeight: `${weekMinHeight}px` }}>
            {week.map((day, dIdx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isCurrMonth = isSameMonth(day, monthDate);
              const isTdy = isToday(day);

              return (
                <div 
                  key={dateStr} 
                  className={`border-r border-b border-gray-100 last:border-r-0 p-1 flex flex-col cursor-pointer hover:bg-gray-50 transition-colors ${!isCurrMonth ? 'bg-gray-50/50' : ''}`}
                  onClick={() => onDateClick(dateStr)}
                >
                  <div className={`text-xs text-center w-6 h-6 mx-auto flex items-center justify-center rounded-full mt-0.5
                    ${isTdy ? 'bg-[var(--accent)] text-white font-bold shadow-sm' : isCurrMonth ? 'text-gray-900 font-medium' : 'text-gray-400'}
                    ${!isTdy && (dIdx === 5 ? 'text-blue-600' : dIdx === 6 ? 'text-red-600' : '')}
                  `}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
            
            {/* Absolute positioning for event bars within the week container */}
            <div className="absolute top-8 left-0 right-0 bottom-0 pointer-events-none">
              {eventLayouts.map(({ event, startCol, colSpan, rowIndex, isStart, isEnd }, idx) => (
                <div
                  key={`${event.event_id}-${rowIndex}-${idx}`}
                  className="absolute pointer-events-auto px-1 py-[2px]"
                  style={{
                    top: `${rowIndex * 28}px`,
                    left: `${(startCol / 7) * 100}%`,
                    width: `${(colSpan / 7) * 100}%`,
                    height: '28px',
                    zIndex: 10
                  }}
                >
                  <div 
                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                    className={`h-full text-xs px-2 flex items-center shadow-sm cursor-pointer hover:opacity-90 transition-opacity overflow-hidden
                      ${isStart ? 'rounded-l-md' : 'rounded-l-none border-l-2 border-white'}
                      ${isEnd ? 'rounded-r-md' : 'rounded-r-none border-r-2 border-white'}
                    `}
                    style={{ background: getEventBackground(event.member_ids) }}
                  >
                    <span className="truncate text-white drop-shadow-md font-medium tracking-tight">
                      {event.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
