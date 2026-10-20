import React from 'react'
import { useSettingsStore } from '../../store/useSettingsStore'
import type { ReaderTheme } from '../../types'
import {
  X,
  Type,
  Sun,
  Moon,
  Coffee,
  Smartphone,
  Palette,
  AlignJustify,
  AlignLeft,
  RotateCcw,
} from 'lucide-react'

interface ReaderSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const FONTS = [
  { name: 'Merriweather (Serif cổ điển)', value: 'Merriweather', fontClass: 'font-serif' },
  { name: 'Lora (Serif tinh tế)', value: 'Lora', fontClass: 'font-serif' },
  { name: 'Literata (Sách Google Play)', value: 'Literata', fontClass: 'font-serif' },
  { name: 'Inter (Sans-serif hiện đại)', value: 'Inter', fontClass: 'font-sans' },
  { name: 'JetBrains Mono (Sách kỹ thuật)', value: 'JetBrains Mono', fontClass: 'font-mono' },
]

export const ReaderSettingsModal: React.FC<ReaderSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const settings = useSettingsStore()

  if (!isOpen) return null

  const themeOptions: {
    id: ReaderTheme
    label: string
    icon: React.ReactNode
    bg: string
    text: string
    border: string
  }[] = [
    {
      id: 'light',
      label: 'Sáng',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      bg: '#ffffff',
      text: '#1e293b',
      border: 'border-slate-300',
    },
    {
      id: 'sepia',
      label: 'Sepia (Giấy)',
      icon: <Coffee className="w-4 h-4 text-amber-700" />,
      bg: '#fbf0d9',
      text: '#4a3728',
      border: 'border-amber-300',
    },
    {
      id: 'dark',
      label: 'Tối (Slate)',
      icon: <Moon className="w-4 h-4 text-blue-400" />,
      bg: '#1e293b',
      text: '#e2e8f0',
      border: 'border-slate-700',
    },
    {
      id: 'oled',
      label: 'OLED (Đen)',
      icon: <Smartphone className="w-4 h-4 text-emerald-400" />,
      bg: '#000000',
      text: '#d1d5db',
      border: 'border-slate-800',
    },
    {
      id: 'custom',
      label: 'Tự chọn',
      icon: <Palette className="w-4 h-4 text-purple-400" />,
      bg: settings.customBgColor,
      text: settings.customTextColor,
      border: 'border-purple-400',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Type className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-base text-slate-100">Tùy biến hiển thị đọc sách</h3>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => settings.resetSettings()}
              title="Đặt lại mặc định"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* 1. Theme Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Chế độ màu nền (Themes)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => settings.setTheme(opt.id)}
                  style={{ backgroundColor: opt.bg, color: opt.text }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    settings.theme === opt.id
                      ? 'ring-2 ring-blue-500 scale-102 shadow-md'
                      : opt.border
                  }`}
                >
                  <div className="mb-1">{opt.icon}</div>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Custom Color Picker if custom theme is chosen */}
            {settings.theme === 'custom' && (
              <div className="mt-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-around text-xs">
                <div className="flex items-center space-x-2">
                  <span>Màu nền:</span>
                  <input
                    type="color"
                    value={settings.customBgColor}
                    onChange={(e) => settings.updateSettings({ customBgColor: e.target.value })}
                    className="w-7 h-7 rounded border border-slate-600 cursor-pointer bg-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span>Màu chữ:</span>
                  <input
                    type="color"
                    value={settings.customTextColor}
                    onChange={(e) => settings.updateSettings({ customTextColor: e.target.value })}
                    className="w-7 h-7 rounded border border-slate-600 cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Font Family */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Font chữ (Typography)
            </label>
            <div className="space-y-1.5">
              {FONTS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => settings.updateSettings({ fontFamily: font.value })}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm border transition-colors ${
                    settings.fontFamily === font.value
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span style={{ fontFamily: font.value }}>{font.name}</span>
                  <span className="text-xs opacity-60">Ví dụ văn bản</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Font Size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Cỡ chữ (Font Size)
              </label>
              <span className="text-xs font-mono text-blue-400 font-bold">
                {settings.fontSize}px
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => settings.setFontSize(settings.fontSize - 1)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center font-bold text-base transition-colors"
              >
                A-
              </button>
              <input
                type="range"
                min="12"
                max="36"
                value={settings.fontSize}
                onChange={(e) => settings.setFontSize(parseInt(e.target.value, 10))}
                className="flex-1 accent-blue-500 cursor-pointer"
              />
              <button
                onClick={() => settings.setFontSize(settings.fontSize + 1)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center font-bold text-lg transition-colors"
              >
                A+
              </button>
            </div>
          </div>

          {/* 4. Line Spacing & Alignment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Khoảng cách dòng
              </label>
              <div className="flex rounded-lg bg-slate-800 p-1 border border-slate-700/60 text-xs">
                {[1.3, 1.6, 1.9].map((lh) => (
                  <button
                    key={lh}
                    onClick={() => settings.updateSettings({ lineHeight: lh })}
                    className={`flex-1 py-1 rounded-md text-center transition-colors ${
                      settings.lineHeight === lh
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lh}x
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Căn lề
              </label>
              <div className="flex rounded-lg bg-slate-800 p-1 border border-slate-700/60 text-xs">
                <button
                  onClick={() => settings.updateSettings({ textAlign: 'justify' })}
                  className={`flex-1 py-1 flex items-center justify-center rounded-md transition-colors ${
                    settings.textAlign === 'justify'
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Căn đều hai bên"
                >
                  <AlignJustify className="w-4 h-4 mr-1" />
                  Đều
                </button>
                <button
                  onClick={() => settings.updateSettings({ textAlign: 'left' })}
                  className={`flex-1 py-1 flex items-center justify-center rounded-md transition-colors ${
                    settings.textAlign === 'left'
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Căn lề trái"
                >
                  <AlignLeft className="w-4 h-4 mr-1" />
                  Trái
                </button>
              </div>
            </div>
          </div>

          {/* 5. Margin Width */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Lề trang (Margins)
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(['narrow', 'normal', 'wide'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => settings.updateSettings({ margin: m })}
                  className={`py-2 px-3 rounded-lg border text-center font-medium capitalize transition-colors ${
                    settings.margin === m
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m === 'narrow' ? 'Hẹp' : m === 'normal' ? 'Vừa' : 'Rộng'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors shadow-lg shadow-blue-500/20"
          >
            Áp dụng & Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
