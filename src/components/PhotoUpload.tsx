'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'

interface PhotoUploadProps {
  value?: string | null
  onChange: (base64: string | null) => void
  variant?: 'circular' | 'horizontal'
  label?: string
}

export default function PhotoUpload({
  value,
  onChange,
  variant = 'circular',
  label = 'Upload Photo'
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setPreview(base64String)
      onChange(base64String)
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = () => {
    setPreview(null)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const containerClass = variant === 'circular'
    ? 'w-32 h-32 rounded-full'
    : 'w-48 h-32 rounded-lg'

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-4">
        {/* Preview or placeholder */}
        <div
          className={`${containerClass} border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800 relative group`}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-8 h-8 text-white" />
              </button>
            </>
          ) : (
            <Upload className="w-8 h-8 text-gray-400" />
          )}
        </div>

        {/* Upload button */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleClick}
          >
            {preview ? 'Change Photo' : 'Upload Photo'}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="ml-2"
            >
              Remove
            </Button>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Max size: 5MB. Formats: JPG, PNG, GIF
          </p>
        </div>
      </div>
    </div>
  )
}
