import { GripVertical, X } from 'lucide-react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Tech } from '@domain';
import { Badge } from '@web/components/ui/badge';
import { cn } from '@web/lib/utils';
import { STATUS_BADGE, type TechStatus } from '../status';

export interface QueueItem {
  tech: Tech;
  status: TechStatus;
}

interface ResearchQueueProps {
  items: QueueItem[];
  onReorder: (orderedIds: string[]) => void;
  onRemove: (techId: string) => void;
}

function SortableRow({
  item,
  position,
  onRemove,
}: {
  item: QueueItem;
  position: number;
  onRemove: (techId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.tech.id,
  });
  const badge = STATUS_BADGE[item.status];
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
      className={cn(
        'flex items-center gap-2 rounded-md border bg-card px-2 py-2',
        // An owned tech is already researched — de-emphasise it in the plan.
        item.status === 'owned' && 'opacity-55',
      )}
    >
      <button
        type="button"
        className="touch-none cursor-grab text-muted-foreground hover:text-foreground"
        aria-label="Drag to reorder"
        title="Drag, or focus and use the arrow keys, to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-5 text-center text-xs tabular-nums text-muted-foreground">{position}</span>
      <span className="min-w-0 flex-1 truncate text-sm">{item.tech.name}</span>
      <Badge variant={badge.variant}>{badge.label}</Badge>
      <button
        type="button"
        aria-label={`Remove ${item.tech.name} from queue`}
        onClick={() => onRemove(item.tech.id)}
        className="rounded p-0.5 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}

/** Ordered, drag-to-reorder research plan. Each row shows its live researchability status. */
export function ResearchQueue({ items, onReorder, onRemove }: ResearchQueueProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (items.length === 0) {
    return (
      <p className="px-1 py-2 text-xs text-muted-foreground">
        No queued techs. Open a tech and tap “Queue” to plan your research order.
      </p>
    );
  }

  const ids = items.map((i) => i.tech.id);
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      onReorder(arrayMove(ids, oldIndex, newIndex));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2">
          {items.map((item, i) => (
            <SortableRow key={item.tech.id} item={item} position={i + 1} onRemove={onRemove} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
