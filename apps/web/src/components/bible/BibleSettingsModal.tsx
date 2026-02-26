import { X } from 'lucide-react'
import { cn } from '@repo/ui/utils'
import type { BibleFont, BibleSettings } from '../../hooks/useBibleSettings'

// ─── Font registry ────────────────────────────────────────────────────────────

export const FONT_FAMILY: Record<BibleFont, string> = {
  lora: '"Lora", Georgia, serif',
  georgia: 'Georgia, serif',
  'roboto-serif': '"Roboto Serif", Georgia, serif',
  'untitled-serif': '"Untitled Serif", Georgia, serif',
}

const FONT_LABEL: Record<BibleFont, string> = {
  lora: 'Lora',
  georgia: 'Georgia',
  'roboto-serif': 'Roboto Serif',
  'untitled-serif': 'Untitled Serif',
}

const PREVIEW_VERSE = 'For God so loved the world that he gave his one and only Son.'

// ─── Component ────────────────────────────────────────────────────────────────

interface BibleSettingsModalProps {
  open: boolean
  settings: BibleSettings
  versions: string[]
  currentVersion: string
  onVersionChange: (v: string) => void
  onSettingsChange: (patch: Partial<BibleSettings>) => void
  onClose: () => void
}

export function BibleSettingsModal({
  open,
  settings,
  versions,
  currentVersion,
  onVersionChange,
  onSettingsChange,
  onClose,
}: BibleSettingsModalProps) {
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="absolute inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-label="Reader settings"
        className="absolute bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-background"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <span className="text-sm font-semibold text-foreground">Reader settings</span>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-6 px-4 pb-10">
          {/* ── Select bible ─────────────────────────────────────────────── */}
          <section>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Select bible
            </p>
            <div className="flex gap-2">
              {versions.map(v => (
                <button
                  key={v}
                  onClick={() => onVersionChange(v)}
                  className={cn(
                    'flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors',
                    v === currentVersion
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </section>

          {/* ── Font type ────────────────────────────────────────────────── */}
          <section>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Font type
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(FONT_FAMILY) as BibleFont[]).map(f => (
                <button
                  key={f}
                  onClick={() => onSettingsChange({ font: f })}
                  style={{ fontFamily: FONT_FAMILY[f] }}
                  className={cn(
                    'rounded-xl border py-2.5 text-sm font-medium transition-colors',
                    f === settings.font
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  {FONT_LABEL[f]}
                </button>
              ))}
            </div>
          </section>

          {/* ── Font size ────────────────────────────────────────────────── */}
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Font size
              </p>
              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                {settings.fontScale}
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={settings.fontScale}
              onChange={e => onSettingsChange({ fontScale: Number(e.target.value) })}
              className="w-full accent-primary"
            />

            {/* Live preview */}
            <p
              className="mt-3 leading-[1.8] text-foreground"
              style={{
                fontFamily: FONT_FAMILY[settings.font],
                fontSize: 12 + settings.fontScale,
              }}
            >
              <sup className="mr-1 text-[11px] font-bold text-muted-foreground">16</sup>
              {PREVIEW_VERSE}
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
