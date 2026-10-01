import React from 'react'
import { Link } from 'react-router-dom'
import {
  StarsIcon,
  CrownStarIcon,
  CheckCircleIcon,
  CloseCircleIcon,
  AltArrowRightIcon,
} from '@solar-icons/react/bold-duotone'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PremiumUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  featureTitle?: string
}

export function PremiumUpgradeModal({
  isOpen,
  onClose,
  featureTitle = 'Add Word & AI Generator',
}: PremiumUpgradeModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-4 sm:p-6 text-center animate-in zoom-in-95 duration-200 space-y-3.5 sm:space-y-4 max-h-[94vh] overflow-y-auto custom-scrollbar">
        {/* Glow Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-primary/20 to-yellow-500/20 border border-primary/30 text-primary flex items-center justify-center mx-auto shadow-md">
          <CrownStarIcon className="w-7 h-7 text-primary" size={28} />
        </div>

        <div>
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest bg-primary/15 text-primary border border-primary/25 rounded-full">
            FOXFORD PREMIUM
          </span>
          <h3 className="text-lg font-extrabold text-foreground mt-2">
            {featureTitle} — Premium Feature
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Adding custom vocabulary, generating instant AI Uzbek translations, definitions, synonyms, antonyms, 2 IELTS sentences, and organizing into personal collections is exclusive to <strong>EduFox Premium</strong> members.
          </p>
        </div>

        {/* Features Checklist */}
        <div className="bg-secondary/40 rounded-xl p-3.5 text-left space-y-2 text-xs border border-border/60">
          <div className="flex items-center gap-2.5 text-foreground font-medium">
            <CheckCircleIcon className="w-4.5 h-4.5 text-emerald-500 shrink-0" size={18} />
            <span>Instant 1-click AI generation for Uzbek meaning, IPA & word class</span>
          </div>
          <div className="flex items-center gap-2.5 text-foreground font-medium">
            <CheckCircleIcon className="w-4.5 h-4.5 text-emerald-500 shrink-0" size={18} />
            <span>IELTS Band 7-8 curated synonyms and antonym pairs</span>
          </div>
          <div className="flex items-center gap-2.5 text-foreground font-medium">
            <CheckCircleIcon className="w-4.5 h-4.5 text-emerald-500 shrink-0" size={18} />
            <span>2 authentic academic example sentences & context usage</span>
          </div>
          <div className="flex items-center gap-2.5 text-foreground font-medium">
            <CheckCircleIcon className="w-4.5 h-4.5 text-emerald-500 shrink-0" size={18} />
            <span>Unlimited personal folders with custom icons & color accents</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1 text-xs h-10 cursor-pointer rounded-xl"
            onClick={onClose}
          >
            Close
          </Button>
          <Link
            to="/premium"
            onClick={onClose}
            className={cn(
              buttonVariants({ variant: 'default' }),
              'flex-1 text-xs h-10 bg-primary text-black hover:bg-primary/90 font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5'
            )}
          >
            <span>Upgrade to Premium</span>
            <AltArrowRightIcon className="w-4 h-4" size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
