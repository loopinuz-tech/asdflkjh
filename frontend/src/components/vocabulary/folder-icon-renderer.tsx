import React from 'react'
import {
  BookBookmarkIcon,
  TranslationIcon,
  StarsIcon,
  FireIcon,
  MedalRibbonIcon,
  ClockCircleIcon,
  Pen2Icon,
  Microphone2Icon,
  TargetIcon,
  ShieldCheckIcon,
  CrownStarIcon,
  FolderIcon,
} from '@solar-icons/react/bold-duotone'

interface FolderIconRendererProps {
  iconName?: string
  className?: string
  size?: number
}

export function FolderIconRenderer({
  iconName = 'folder',
  className = 'w-4 h-4',
  size = 18,
}: FolderIconRendererProps) {
  switch (iconName?.toLowerCase()) {
    case 'book':
      return <BookBookmarkIcon className={className} size={size} />
    case 'translation':
      return <TranslationIcon className={className} size={size} />
    case 'star':
      return <StarsIcon className={className} size={size} />
    case 'fire':
      return <FireIcon className={className} size={size} />
    case 'medal':
      return <MedalRibbonIcon className={className} size={size} />
    case 'clock':
      return <ClockCircleIcon className={className} size={size} />
    case 'pen':
      return <Pen2Icon className={className} size={size} />
    case 'microphone':
      return <Microphone2Icon className={className} size={size} />
    case 'target':
      return <TargetIcon className={className} size={size} />
    case 'shield':
      return <ShieldCheckIcon className={className} size={size} />
    case 'crown':
      return <CrownStarIcon className={className} size={size} />
    case 'folder':
    default:
      return <FolderIcon className={className} size={size} />
  }
}
