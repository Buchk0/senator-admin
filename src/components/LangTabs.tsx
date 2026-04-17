import { useState } from 'react'
import type { Lang, LocalizedField } from '../types'

interface LangTabsProps {
  label: string
  value: LocalizedField
  onChange: (val: LocalizedField) => void
  multiline?: boolean
  required?: boolean
}

const LANGS: { key: Lang; label: string }[] = [
  { key: 'en', label: 'EN' },
  { key: 'ru', label: 'RU' },
  { key: 'kz', label: 'KZ' },
]

export default function LangTabs({ label, value, onChange, multiline = false, required = false }: LangTabsProps) {
  const [activeTab, setActiveTab] = useState<Lang>('en')

  const handleChange = (lang: Lang, text: string) => {
    onChange({ ...value, [lang]: text })
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Tab buttons */}
      <div className="flex gap-1 mb-1">
        {LANGS.map(({ key, label: langLabel }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`px-3 py-1 text-xs font-semibold rounded-t-md border transition-colors ${
              activeTab === key
                ? 'border-b-white text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={
              activeTab === key
                ? { backgroundColor: '#1a2035', borderColor: '#1a2035' }
                : { backgroundColor: '#f3f4f6' }
            }
          >
            {langLabel}
          </button>
        ))}
      </div>

      {/* Input */}
      {multiline ? (
        <textarea
          value={value[activeTab]}
          onChange={(e) => handleChange(activeTab, e.target.value)}
          required={required && activeTab === 'en'}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg rounded-tl-none text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
          placeholder={`${label} (${activeTab.toUpperCase()})`}
        />
      ) : (
        <input
          type="text"
          value={value[activeTab]}
          onChange={(e) => handleChange(activeTab, e.target.value)}
          required={required && activeTab === 'en'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg rounded-tl-none text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          placeholder={`${label} (${activeTab.toUpperCase()})`}
        />
      )}
    </div>
  )
}
