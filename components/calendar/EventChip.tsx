import { CalendarEvent } from '@/types/events';
import { CATEGORY_META } from '@/lib/utils/categorize';

interface Props {
  event: CalendarEvent;
  onClick: () => void;
}

export default function EventChip({ event, onClick }: Props) {
  const meta = CATEGORY_META[event.category];

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={event.title}
      className={`
        w-full text-left px-1.5 py-0.5 rounded border text-xs font-medium
        truncate leading-tight transition-opacity hover:opacity-75
        ${meta.chipClass}
      `}
    >
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dotClass} mr-1 flex-shrink-0`}
      />
      <span className="truncate">{event.title}</span>
    </button>
  );
}
