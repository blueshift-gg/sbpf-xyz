"use client";

import { useState } from "react";
import { Button, Input, Dropdown, Icon } from "@blueshift-gg/ui-components";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { v4 as uuidv4 } from "uuid";
import {
  Account,
  ACCOUNT_TYPES,
  TOKEN2022_EXTENSIONS,
  Extension,
  INSTRUCTION_DATA_TYPES,
  InstructionDataType,
} from "../types";
import { SortableCustomField } from "./SortableCustomField";

interface AccountEntryProps {
  account: Account;
  index: number;
  accounts: Account[];
  updateAccount: (index: number, updatedAccount: Account) => void;
  removeAccount: (index: number) => void;
  dragHandle?: React.ReactNode;
}

export const AccountEntry = ({
  account,
  index,
  accounts,
  updateAccount,
  removeAccount,
  dragHandle,
}: AccountEntryProps) => {
  const [isExtensionsCollapsed, setIsExtensionsCollapsed] = useState(false);
  const [isCustomFieldsCollapsed, setIsCustomFieldsCollapsed] = useState(false);

  const extensionSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const customFieldSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddExtension = (ext: Extension) => {
    const newExtensions = [...(account.extensions || []), ext];
    const newLength =
      ACCOUNT_TYPES[account.type] +
      newExtensions.reduce((sum, e) => sum + TOKEN2022_EXTENSIONS[e], 0);
    updateAccount(index, {
      ...account,
      extensions: newExtensions,
      dataLength: newLength,
    });
  };

  const handleRemoveExtension = (ext: Extension) => {
    const newExtensions = (account.extensions || []).filter((e) => e !== ext);
    const newLength =
      ACCOUNT_TYPES[account.type] +
      newExtensions.reduce((sum, e) => sum + TOKEN2022_EXTENSIONS[e], 0);
    updateAccount(index, {
      ...account,
      extensions: newExtensions,
      dataLength: newLength,
    });
  };

  const handleChangeExtension = (oldExt: Extension, newExt: Extension) => {
    const newExtensions = (account.extensions || []).map((e) =>
      e === oldExt ? newExt : e
    );
    const newLength =
      ACCOUNT_TYPES[account.type] +
      newExtensions.reduce((sum, e) => sum + TOKEN2022_EXTENSIONS[e], 0);
    updateAccount(index, {
      ...account,
      extensions: newExtensions,
      dataLength: newLength,
    });
  };

  const getAvailableExtensions = (currentExt?: Extension) => {
    const usedExtensions = account.extensions || [];
    return Object.keys(TOKEN2022_EXTENSIONS).filter(
      (ext) => ext === currentExt || !usedExtensions.includes(ext as Extension)
    ) as Extension[];
  };

  const handleAddExtensionButton = () => {
    const availableExtensions = getAvailableExtensions();
    if (availableExtensions.length > 0) {
      handleAddExtension(availableExtensions[0]);
    }
  };

  const handleExtensionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && account.extensions) {
      const oldIndex = account.extensions.indexOf(active.id as Extension);
      const newIndex = account.extensions.indexOf(over.id as Extension);
      const reorderedExtensions = arrayMove(account.extensions, oldIndex, newIndex);
      updateAccount(index, {
        ...account,
        extensions: reorderedExtensions,
      });
    }
  };

  const handleAddCustomField = () => {
    const newField = {
      id: uuidv4(),
      name: `field_${(account.customFields?.length || 0) + 1}`,
      type: "u8" as InstructionDataType,
    };
    const newCustomFields = [...(account.customFields || []), newField];
    const newLength = calculateCustomFieldsSize(newCustomFields);
    updateAccount(index, {
      ...account,
      customFields: newCustomFields,
      dataLength: newLength,
    });
  };

  const calculateCustomFieldsSize = (
    fields: {
      id?: string;
      name: string;
      type: InstructionDataType;
      size?: number;
    }[]
  ) => {
    return fields.reduce((total, field) => {
      if (field.type === "[u8;N]") {
        return total + (field.size || 0);
      }
      return total + INSTRUCTION_DATA_TYPES[field.type];
    }, 0);
  };

  const isDuplicateName = (name: string) => {
    if (name.trim() === "") return false;
    const duplicateIndexes = accounts
      .map((acc, i) => (acc.name.toLowerCase() === name.toLowerCase() ? i : -1))
      .filter((i) => i !== -1);
    return duplicateIndexes.length > 1 && duplicateIndexes[0] !== index;
  };

  const handleCustomFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && account.customFields) {
      const oldIndex = active.id as number;
      const newIndex = over.id as number;
      const reorderedFields = arrayMove(
        account.customFields,
        oldIndex,
        newIndex
      );
      updateAccount(index, {
        ...account,
        customFields: reorderedFields,
      });
    }
  };

  const accountTypeItems = Object.keys(ACCOUNT_TYPES).map((type) => ({
    label: type,
    value: type,
  }));

  const getExtensionDropdownItems = (currentExt: Extension) => {
    return getAvailableExtensions(currentExt).map((ext) => ({
      label: `${ext} (+${TOKEN2022_EXTENSIONS[ext]} bytes)`,
      value: ext,
    }));
  };

  const hasAvailableExtensions = getAvailableExtensions().length > 0;

  return (
    <div className="flex sm:flex-row flex-col gap-2 items-stretch h-full">
      {dragHandle}
      <div className="flex flex-col gap-4 w-full dashed-border py-4 px-3">
        <div className="flex items-center gap-x-1.5">
          <div className="flex items-center gap-x-1 w-full">
            <div className="flex flex-col gap-y-2 w-full">
              <span className="text-shade-secondary text-sm font-medium">Name</span>
              <Input
                placeholder="Account name"
                value={account.name}
                onChange={(value) => {
                  updateAccount(index, { ...account, name: value });
                }}
                isValid={
                  !isDuplicateName(account.name) || account.name.trim() === ""
                }
                message={
                  isDuplicateName(account.name) && account.name.trim() !== ""
                    ? "Account name must be unique"
                    : undefined
                }
                hasMessage={false}
                innerClassname="h-full min-h-[48px]!"
                className="h-full min-h-[48px]!"
              />
            </div>
            <div className="flex flex-col gap-y-2 lg:min-w-[65%] lg:shrink-0">
              <span className="text-shade-secondary text-sm font-medium">Type</span>
              <Input
                placeholder={
                  account.type.startsWith("Token2022")
                    ? "82 + extensions"
                    : "Data length"
                }
                value={account.dataLength.toString()}
                onChange={(value) =>
                  updateAccount(index, {
                    ...account,
                    dataLength: parseInt(value) || 0,
                  })
                }
                disabled={
                  account.type === "SPL Token" ||
                  account.type === "SPL Mint" ||
                  account.type === "TypedAccount"
                }
                hasMessage={false}
                innerClassname="py-1! pl-1! "

              >
                <Dropdown
                  items={accountTypeItems}
                  selectedItem={account.type}
                  handleChange={(value) => {
                    const typeValue = value as keyof typeof ACCOUNT_TYPES;
                    const baseLen = ACCOUNT_TYPES[typeValue];
                    updateAccount(index, {
                      ...account,
                      type: typeValue,
                      dataLength: baseLen,
                      extensions: typeValue.startsWith("Token2022")
                        ? account.extensions || []
                        : [],
                    });
                  }}
                  label={account.type || "Type"}
                  size="md"
                  className="order-first!"
                  buttonClassName="py-2.5!"
                  showClear={false}
                />
              </Input>
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={() => removeAccount(index)}
              icon={{ name: "Bin" }}
              crosshairProps={{ size: 0}}
              hideLabel
              className="mt-auto shrink-0 h-[48px]! w-[48px]! text-state-error before:bg-state-error/15 hover:text-state-error hover:before:bg-state-error/5"
            />
          </div>
        </div>

        {/* Extensions UI */}
        {account.type.startsWith("Token2022") && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-x-1">
              <span className="text-sm font-medium text-shade-secondary">
                Extensions
              </span>
              <button
                onClick={() => setIsExtensionsCollapsed(!isExtensionsCollapsed)}
                className="p-1 hover:bg-card-foreground rounded cursor-pointer"
              >
                <Icon
                  name={isExtensionsCollapsed ? "Plus" : "Minus"}
                  size={12}
                />
              </button>
            </div>

            {!isExtensionsCollapsed && (
              <>
                <DndContext
                  sensors={extensionSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleExtensionDragEnd}
                >
                  <SortableContext
                    items={account.extensions || []}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-1">
                      {account.extensions?.map((ext) => (
                        <SortableExtension
                          key={ext}
                          ext={ext}
                          dropdownItems={getExtensionDropdownItems(ext)}
                          onChangeExtension={(newExt) =>
                            handleChangeExtension(ext, newExt)
                          }
                          onRemoveExtension={() => handleRemoveExtension(ext)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <Button
                  onClick={handleAddExtensionButton}
                  variant="secondary"
                  size="sm"
                  icon={{ name: "Add" }}
                  label="Add Extension"
                  disabled={!hasAvailableExtensions}
                />
              </>
            )}
          </div>
        )}

        {/* Custom Fields UI for TypedAccount */}
        {account.type === "TypedAccount" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-x-1">
              <span className="text-sm font-medium text-shade-secondary">
                Custom Fields
              </span>
              <button
                onClick={() =>
                  setIsCustomFieldsCollapsed(!isCustomFieldsCollapsed)
                }
                className="p-1 hover:bg-card-foreground rounded cursor-pointer"
              >
                <Icon
                  name={isCustomFieldsCollapsed ? "Plus" : "Minus"}
                  size={12}
                />
              </button>
            </div>

            {!isCustomFieldsCollapsed && (
              <>
                <DndContext
                  sensors={customFieldSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleCustomFieldDragEnd}
                >
                  <SortableContext
                    items={account.customFields?.map((_, index) => index) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-1">
                      {account.customFields?.map((field, fieldIndex) => (
                        <SortableCustomField
                          key={field.id || `field-${index}-${fieldIndex}`}
                          field={field}
                          fieldIndex={fieldIndex}
                          accountIndex={index}
                          customFields={account.customFields || []}
                          updateAccount={updateAccount}
                          account={account}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <Button
                  onClick={handleAddCustomField}
                  variant="secondary"
                  size="sm"
                  icon={{ name: "Add" }}
                  label="Add Field"
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface SortableExtensionProps {
  ext: Extension;
  dropdownItems: { label: string; value: string }[];
  onChangeExtension: (newExt: Extension) => void;
  onRemoveExtension: () => void;
}

const SortableExtension = ({
  ext,
  dropdownItems,
  onChangeExtension,
  onRemoveExtension,
}: SortableExtensionProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ext });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-x-1 px-2 py-1 rounded ${isDragging ? "z-10 opacity-50" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 flex bg-background items-center justify-center"
      >
        <Icon name="Grip" size={16} className="text-shade-tertiary" />
      </div>
      <div className="flex items-center justify-between flex-1 p-1 bg-background border-border border">
        <Dropdown
          items={dropdownItems}
          selectedItem={ext}
          handleChange={(value) => {
            if (value && value !== ext) {
              onChangeExtension(value as Extension);
            }
          }}
          label={`${ext} (${TOKEN2022_EXTENSIONS[ext]} bytes)`}
          size="sm"
          showClear={false}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={onRemoveExtension}
          icon={{ name: "Bin" }}
          hideLabel
          className="text-state-error before:bg-state-error/15 hover:text-state-error hover:before:bg-state-error/5"
        />
      </div>
    </div>
  );
};

interface SortableAccountEntryProps {
  account: Account;
  index: number;
  accounts: Account[];
  updateAccount: (index: number, updatedAccount: Account) => void;
  removeAccount: (index: number) => void;
}

export const SortableAccountEntry = ({
  account,
  index,
  accounts,
  updateAccount,
  removeAccount,
}: SortableAccountEntryProps) => {
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
      <AccountEntry
        account={account}
        index={index}
        accounts={accounts}
        updateAccount={updateAccount}
        removeAccount={removeAccount}
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
