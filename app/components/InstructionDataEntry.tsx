"use client";

import { Button, Input, Dropdown, Icon } from "@blueshift-gg/ui-components";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  InstructionDataField,
  INSTRUCTION_DATA_TYPES,
  InstructionDataType,
} from "../types";

interface InstructionDataEntryProps {
  field: InstructionDataField;
  index: number;
  fields: InstructionDataField[];
  updateField: (index: number, field: InstructionDataField) => void;
  removeField: (index: number) => void;
  dragHandle?: React.ReactNode;
}

export const InstructionDataEntry = ({
  field,
  index,
  fields,
  updateField,
  removeField,
  dragHandle,
}: InstructionDataEntryProps) => {
  const isDuplicateFieldName = (name: string) => {
    if (name.trim() === "") return false;
    const duplicateIndexes = fields
      .map((f, i) => (f.name.toLowerCase() === name.toLowerCase() ? i : -1))
      .filter((i) => i !== -1);
    return duplicateIndexes.length > 1 && duplicateIndexes[0] !== index;
  };

  const typeItems = Object.keys(INSTRUCTION_DATA_TYPES).map((type) => ({
    label: type,
    value: type,
  }));

  return (
    <div className="flex sm:flex-row flex-col gap-2 items-stretch">
      {dragHandle}
      <div className="flex items-center gap-x-1 w-full">
      <div className="flex-1">
        <Input
          placeholder="Field name"
          value={field.name}
          onChange={(value) =>
            updateField(index, { ...field, name: value })
          }
          isValid={!isDuplicateFieldName(field.name) || field.name.trim() === ""}
          hasMessage={false}
          message={isDuplicateFieldName(field.name) && field.name.trim() !== "" ? "Field name must be unique" : undefined}
          innerClassname="py-1! pl-1!"
        >
          <Dropdown
            items={typeItems}
            selectedItem={field.type}
            handleChange={(value) =>
              updateField(index, {
                ...field,
                type: value as InstructionDataType,
                size: value === "[u8;N]" ? field.size || 1 : undefined,
              })
            }
            label={field.type}
            size="md"
            className="order-first!"
            buttonClassName="py-2.5!"
            showClear={false}
          />
        </Input>
      </div>
      {field.type === "[u8;N]" && (
        <div className="w-20">
          <Input
            placeholder="Size"
            hasMessage={false}
            innerClassname="h-full min-h-[48px]!"
            className="h-full min-h-[48px]!"
            value={(field.size || 1).toString()}
            onChange={(value) =>
              updateField(index, {
                ...field,
                size: parseInt(value) || 1,
              })
            }
          />
        </div>
      )}
      <Button
        variant="secondary"
        size="md"
        className="shrink-0 h-[48px]! w-[48px]! text-state-error before:bg-state-error/15 hover:text-state-error hover:before:bg-state-error/5"
        crosshairProps={{ size: 0 }}
        onClick={() => removeField(index)}
        icon={{ name: "Bin" }}
        hideLabel
      />
      </div>
    </div>
  );
};

interface SortableInstructionDataEntryProps {
  field: InstructionDataField;
  index: number;
  fields: InstructionDataField[];
  updateField: (index: number, field: InstructionDataField) => void;
  removeField: (index: number) => void;
}

export const SortableInstructionDataEntry = ({
  field,
  index,
  fields,
  updateField,
  removeField,
}: SortableInstructionDataEntryProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "z-10" : ""}`}
    >
      <InstructionDataEntry
        field={field}
        index={index}
        fields={fields}
        updateField={updateField}
        removeField={removeField}
        dragHandle={
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 flex bg-background items-center justify-center"
          >
            <Icon name="Grip" className="text-shade-tertiary" />
          </div>
        }
      />
    </div>
  );
};
