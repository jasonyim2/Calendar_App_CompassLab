'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import CalendarHeader from '@/components/CalendarHeader';
import FilterBar from '@/components/FilterBar';
import CalendarGrid from '@/components/CalendarGrid';
import EventModal from '@/components/EventModal';
import EventFormModal from '@/components/EventFormModal';
import { Event, Member } from '@/types';

export default function Home() {
  const [currentMonth, setCurrentMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState('전체');
  const [selectedInstructorId, setSelectedInstructorId] = useState('all');

  // Modals
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInitialEvent, setFormInitialEvent] = useState<Event | undefined>(undefined);
  const [formInitialDate, setFormInitialDate] = useState<string | undefined>(undefined);

  const fetchMembers = async () => {
    const res = await fetch('/api/members');
    if (!res.ok) throw new Error('Failed to fetch members');
    const data = await res.json();
    setMembers(data);
  };

  const fetchEvents = async (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const res = await fetch(`/api/events?year=${year}&month=${month}`);
    if (!res.ok) throw new Error('Failed to fetch events');
    const data = await res.json();
    setEvents(data);
  };

  const loadData = useCallback(async (monthStr: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        members.length === 0 ? fetchMembers() : Promise.resolve(),
        fetchEvents(monthStr)
      ]);
    } catch (err) {
      console.error(err);
      setError('일정을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [members.length]);

  useEffect(() => {
    loadData(currentMonth);
  }, [currentMonth, loadData]);

  const handleSaveEvent = async (payload: Partial<Event>) => {
    try {
      if (payload.event_id) {
        const res = await fetch(`/api/events/${payload.event_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to update event');
      } else {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to create event');
      }
      setIsFormOpen(false);
      setFormInitialEvent(undefined);
      loadData(currentMonth);
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteEvent = async (event_id: string) => {
    try {
      const res = await fetch(`/api/events/${event_id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete event');
      setSelectedEvent(null);
      loadData(currentMonth);
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (selectedType !== '전체' && e.type !== selectedType) return false;
      if (selectedInstructorId !== 'all') {
        const ids = e.member_ids ? e.member_ids.split(',').map(s => s.trim()) : [];
        if (!ids.includes(selectedInstructorId)) return false;
      }
      return true;
    });
  }, [events, selectedType, selectedInstructorId]);

  return (
    <div className="flex flex-col h-full bg-white relative">
      {error && (
        <div className="bg-red-50 text-[var(--accent)] px-6 py-3 flex justify-between items-center border-b border-red-100 z-10">
          <span className="font-medium text-sm">{error}</span>
          <button onClick={() => loadData(currentMonth)} className="text-sm font-semibold underline hover:no-underline px-2 py-1">
            다시 시도
          </button>
        </div>
      )}

      <CalendarHeader 
        currentMonth={currentMonth} 
        onChange={(m) => setCurrentMonth(m)} 
      />
      
      <FilterBar 
        members={members}
        selectedType={selectedType}
        selectedInstructorId={selectedInstructorId}
        onTypeChange={setSelectedType}
        onInstructorChange={setSelectedInstructorId}
      />

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50/50">
          <svg className="animate-spin h-8 w-8 text-[var(--primary)] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-medium text-sm">불러오는 중...</span>
        </div>
      ) : (
        <CalendarGrid 
          currentMonth={currentMonth}
          events={filteredEvents}
          members={members}
          onDateClick={(date) => {
            setFormInitialDate(date);
            setFormInitialEvent(undefined);
            setIsFormOpen(true);
          }}
          onEventClick={(event) => {
            setSelectedEvent(event);
          }}
        />
      )}

      {selectedEvent && (
        <EventModal 
          event={selectedEvent}
          members={members}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => {
            setFormInitialEvent(selectedEvent);
            setIsFormOpen(true);
            setSelectedEvent(null);
          }}
          onDelete={() => handleDeleteEvent(selectedEvent.event_id)}
          onCopy={() => {
            setFormInitialEvent({
              ...selectedEvent,
              event_id: '',
              start_date: '',
              end_date: '',
            });
            setIsFormOpen(true);
            setSelectedEvent(null);
          }}
        />
      )}

      {isFormOpen && (
        <EventFormModal 
          initialEvent={formInitialEvent}
          initialDate={formInitialDate}
          members={members}
          onClose={() => {
            setIsFormOpen(false);
            setFormInitialEvent(undefined);
            setFormInitialDate(undefined);
          }}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  );
}
