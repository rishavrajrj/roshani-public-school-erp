import React from 'react'
import Image from 'next/image'

interface SchoolLogoProps {
  className?: string
  imgClassName?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  priority?: boolean
}

export function SchoolLogo({
  className = '',
  imgClassName = '',
  size,
  priority = false,
}: SchoolLogoProps) {
  const dimensionMap: Record<string, number> = {
    xs: 32,
    sm: 48,
    md: 68,
    lg: 88,
    xl: 110,
    '2xl': 140,
  }

  const px = size ? dimensionMap[size] : undefined

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <Image
        src="/images/logo.webp"
        alt="Roshani Public School Logo"
        width={px || 120}
        height={px || 120}
        priority={priority}
        className={`w-full h-full object-contain drop-shadow-md ${imgClassName}`}
        style={px ? { width: `${px}px`, height: `${px}px` } : undefined}
      />
    </div>
  )
}
