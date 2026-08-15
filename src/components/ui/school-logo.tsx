import React from 'react'
import Image from 'next/image'

interface SchoolLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  priority?: boolean
}

export function SchoolLogo({ className = '', size = 'md', priority = false }: SchoolLogoProps) {
  const dimensionMap = {
    sm: 48,
    md: 68,
    lg: 88,
    xl: 110,
  }

  const px = dimensionMap[size]

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <Image
        src="/images/logo.webp"
        alt="Roshani Public School Logo"
        width={px}
        height={px}
        priority={priority}
        className="w-auto h-auto object-contain drop-shadow-md"
        style={{ width: `${px}px`, height: `${px}px` }}
      />
    </div>
  )
}
