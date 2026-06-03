import { CalendarEvent } from '@/types/events';
import { CATEGORY_META, getHeatBadge } from '@/lib/utils/categorize';

interface Props {
  event: CalendarEvent;
  onClick: () => void;
}

export default function EventChip({ event, onClick }: Props) {
  const meta = CATEGORY_META[event.category];
  const heat = getHeatBadge(event.title, event.actual, event.estimate);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={event.title}
      className={`
        w-full text-left px-1.5 py-0.5 rounded border text-xs font-medium
        leading-tight transition-opacity hover:opacity-75 flex items-center gap-1
        ${meta.chipClass}
      `}
    >
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dotClass} flex-shrink-0`}
      />
      <span className="truncate flex-1">{event.title}</span>
      {heat && (
        <span
          className={`flex-shrink-0 text-[9px] font-bold px-1 py-px rounded leading-none ${
            heat === 'HOT'
              ? 'bg-red-500/30 text-red-300'
              : 'bg-blue-500/30 text-blue-300'
          }`}
        >
          {heat}
        </span>
      )}
    </button>
  );
}
