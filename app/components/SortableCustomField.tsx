"use client";

import React, { memo } from "react";
import { Button, Input, Dropdown, Icon } from "@blueshift-gg/ui-components";
import {

  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Account,
  INSTRUCTION_DATA_TYPES,
  InstructionDataType,
} from "../types";

interface SortableCustomFieldProps {
  field: {
    id?: string;
    name: string;
    type: InstructionDataType;
    size?: number;
  };
  fieldIndex: number;
  accountIndex: number;
  customFields: {
    id?: string;
    name: string;
    type: InstructionDataType;
    size?: number;
  }[];
  updateAccount: (index: number, updatedAccount: Account) => void;
  account: Account;
}

export const SortableCustomField = memo(
  ({
    field,
    fieldIndex,
    accountIndex,
    customFields,
    updateAccount,
    account,
  }: SortableCustomFieldProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: fieldIndex });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition: isDragging ? transition : undefined,
    };

    const handleUpdateCustomField = (updatedField: {
      id?: string;
      name: string;
      type: InstructionDataType;
      size?: number;
    }) => {
      const newCustomFields = [...customFields];
      newCustomFields[fieldIndex] = updatedField;
      const newLength = newCustomFields.reduce((total, f) => {
        if (f.type === "[u8;N]") {
          return total + (f.size || 0);
        }
        return total + INSTRUCTION_DATA_TYPES[f.type];
      }, 0);
      updateAccount(accountIndex, {
        ...account,
        customFields: newCustomFields,
        dataLength: newLength,
      });
    };

    const handleRemoveCustomField = () => {
      const newCustomFields = customFields.filter((_, i) => i !== fieldIndex);
      const newLength = newCustomFields.reduce((total, f) => {
        if (f.type === "[u8;N]") {
          return total + (f.size || 0);
        }
        return total + INSTRUCTION_DATA_TYPES[f.type];
      }, 0);
      updateAccount(accountIndex, {
        ...account,
        customFields: newCustomFields,
        dataLength: newLength,
      });
    };

    const isDuplicateCustomFieldName = (name: string) => {
      if (name.trim() === "" || !customFields) return false;
      const duplicateIndexes = customFields
        .map((f, i) => (f.name.toLowerCase() === name.toLowerCase() ? i : -1))
        .filter((i) => i !== -1);
      return duplicateIndexes.length > 1 && duplicateIndexes[0] !== fieldIndex;
    };

    const typeItems = Object.keys(INSTRUCTION_DATA_TYPES).map((type) => ({
      label: type,
      value: type,
    }));

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex gap-2 items-end px-2 py-2 rounded bg-background ${isDragging ? "z-10" : ""
          }`}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 flex bg-background items-center justify-center"
        >
          <Icon name="Grip" className="text-shade-tertiary" />
        </div>
        <div className="flex-1">
          <Input
            placeholder="Field name"
            value={field.name}
            onChange={(value) =>
              handleUpdateCustomField({ ...field, name: value })
            }
            isValid={!isDuplicateCustomFieldName(field.name) || field.name.trim() === ""}
            message={isDuplicateCustomFieldName(field.name) && field.name.trim() !== "" ? "Field name must be unique" : undefined}
            className="h-8 text-xs"
            hasMessage={false}
          />
        </div>
        <div className="w-24">
          <Dropdown
            items={typeItems}
            selectedItem={field.type}
            handleChange={(value) =>
              handleUpdateCustomField({
                ...field,
                type: value as InstructionDataType,
                size: value === "[u8;N]" ? field.size || 1 : undefined,
              })
            }
            label={field.type}
            size="sm"
            buttonClassName="h-8"
          />
        </div>
        {field.type === "[u8;N]" && (
          <div className="w-16">
            <Input
              placeholder="Size"
              value={(field.size || 1).toString()}
              onChange={(value) =>
                handleUpdateCustomField({
                  ...field,
                  size: parseInt(value) || 1,
                })
              }
              className="h-8 text-xs"
              hasMessage={false}
            />
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemoveCustomField}
          icon={{ name: "Bin" }}
          hideLabel
          className="h-8 w-8 text-state-error"
        />
      </div>
    );
  }
);

SortableCustomField.displayName = "SortableCustomField";
