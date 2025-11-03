'use client'

import { User, Building2 } from 'lucide-react'

interface PhotoProps {
  src?: string | null
  alt?: string
  variant?: 'circular' | 'horizontal'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  type?: 'person' | 'organization'
}

const sizeClasses = {
  circular: {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  },
  horizontal: {
    sm: 'w-12 h-8',
    md: 'w-16 h-12',
    lg: 'w-32 h-24',
    xl: 'w-48 h-32'
  }
}

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
}

export default function Photo({
  src,
  alt = 'Photo',
  variant = 'circular',
  size = 'md',
  type = 'person'
}: PhotoProps) {
  const sizeClass = sizeClasses[variant][size]
  const iconSize = iconSizes[size]
  const roundedClass = variant === 'circular' ? 'rounded-full' : 'rounded-lg'

  const Icon = type === 'person' ? User : Building2

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} ${roundedClass} object-cover bg-gray-100 dark:bg-gray-800`}
      />
    )
  }

  // Placeholder when no photo
  return (
    <div
      className={`${sizeClass} ${roundedClass} bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}
    >
      <Icon className={`${iconSize} text-gray-400 dark:text-gray-500`} />
    </div>
  )
}
