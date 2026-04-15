'use client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { SadotField } from '@/types';
import SadotItem from './SadotItem';

export default function SadotList({
  sadot,
  onChange,
}: {
  sadot: SadotField[];
  onChange: (sadot: SadotField[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sadot.findIndex((f) => f.key === active.id);
      const newIndex = sadot.findIndex((f) => f.key === over.id);
      onChange(arrayMove(sadot, oldIndex, newIndex));
    }
  }

  function updateLabel(key: string, label: string) {
    onChange(sadot.map((f) => (f.key === key ? { ...f, label } : f)));
  }

  function updateValue(key: string, value: string) {
    onChange(sadot.map((f) => (f.key === key ? { ...f, value } : f)));
  }

  function deleteField(key: string) {
    onChange(sadot.filter((f) => f.key !== key));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sadot.map((f) => f.key)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {sadot.map((field) => (
            <SadotItem
              key={field.key}
              field={field}
              onLabelChange={updateLabel}
              onValueChange={updateValue}
              onDelete={deleteField}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
