'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, X, Link } from 'lucide-react'

interface PhotoUploadProps {
  value?: string | null
  onChange: (base64: string | null) => void
  variant?: 'circular' | 'horizontal'
  label?: string
}

type UploadMode = 'file' | 'url'

export default function PhotoUpload({
  value,
  onChange,
  variant = 'circular',
  label = 'Upload Photo'
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [mode, setMode] = useState<UploadMode>('file')
  const [urlInput, setUrlInput] = useState<string>('')
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
    setUrlInput('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value)
  }

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      alert('Please enter a valid URL')
      return
    }

    // Basic URL validation
    try {
      new URL(urlInput)
      setPreview(urlInput)
      onChange(urlInput)
    } catch {
      alert('Please enter a valid URL')
    }
  }

  const handleModeToggle = () => {
    setMode(mode === 'file' ? 'url' : 'file')
    // Clear inputs when switching modes
    setUrlInput('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const containerClass = variant === 'circular'
    ? 'w-32 h-32 rounded-full'
    : 'w-48 h-32 rounded-lg'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleModeToggle}
          className="text-xs"
        >
          {mode === 'file' ? (
            <>
              <Link className="w-3 h-3 mr-1" />
              Use URL
            </>
          ) : (
            <>
              <Upload className="w-3 h-3 mr-1" />
              Upload File
            </>
          )}
        </Button>
      </div>
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

        {/* Upload button or URL input */}
        <div className="space-y-2 flex-1">
          {mode === 'file' ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex gap-2">
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
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Max size: 5MB. Formats: JPG, PNG, GIF
              </p>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={handleUrlChange}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleUrlSubmit()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUrlSubmit}
                >
                  Apply
                </Button>
                {preview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enter a valid image URL (e.g., from LinkedIn, company website)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
