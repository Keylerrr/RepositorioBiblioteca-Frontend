"use client";

import { Select } from "radix-ui";
import { ChevronDown } from "lucide-react";
import Button from "@/shared/components/Button";

export default function UserPresetSelector({ presets, value, onChange, onApply, disabled, loading, className = "" }) {
  return (
    <div className={`flex min-w-0 flex-wrap items-end gap-3 ${className}`}>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:w-60 sm:flex-none">
        <label id="user-preset-label" htmlFor="user-preset" className="block text-xs font-semibold text-[#171A1F]">Aplicar preset</label>
        <Select.Root value={value} onValueChange={onChange} disabled={disabled || loading || !presets.length}>
          <Select.Trigger id="user-preset" aria-labelledby="user-preset-label" className="flex h-12 w-full items-center justify-between gap-2 rounded-lg border border-[#DCE0E5] bg-white px-4 text-left text-sm text-[#171A1F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8102E] disabled:opacity-60">
            <span className="truncate"><Select.Value placeholder={loading ? "Cargando presets…" : presets.length ? "Seleccione" : "Sin presets disponibles"} /></span>
            <Select.Icon><ChevronDown aria-hidden="true" className="size-5 shrink-0 text-[#68707C]" /></Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content position="popper" sideOffset={4} collisionPadding={16} className="z-50 max-h-[var(--radix-select-content-available-height)] w-[var(--radix-select-trigger-width)] overflow-y-auto rounded-lg border border-[#DCE0E5] bg-white py-1 text-[13px] shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12)]">
              <Select.Viewport>
                {presets.map((preset) => <Select.Item key={preset.id} value={String(preset.id)} className="flex min-h-[42px] cursor-pointer items-center gap-1 px-4 py-2 text-[#171A1F] outline-none data-[highlighted]:bg-[#FFF1F2] data-[state=checked]:bg-[#FFE1E3] data-[state=checked]:font-semibold data-[state=checked]:text-[#A90D27]">
                  <Select.ItemText>{preset.name}</Select.ItemText>
                  <Select.ItemIndicator aria-hidden="true">✓</Select.ItemIndicator>
                </Select.Item>)}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>
      <Button onClick={onApply} disabled={disabled || loading || !value || !presets.length} className="!h-12 !min-w-0 !w-[158px] !border-[#C8102E] !bg-[#C8102E] !px-4 hover:!bg-[#A80D27] disabled:!opacity-40">Aplicar preset</Button>
    </div>
  );
}
