import React, { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
  isCollapsed: boolean
  isHovered: boolean
  isExpanded: boolean
  toggleCollapse: () => void
  setIsCollapsed: (collapsed: boolean) => void
  setHovered: (hovered: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

const STORAGE_KEY = 'foxford_dashboard_sidebar_collapsed'

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [isHovered, setIsHovered] = useState<boolean>(false)

  const setIsCollapsed = (collapsed: boolean) => {
    setIsCollapsedState(collapsed)
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed))
    } catch {}
    if (!collapsed) {
      setIsHovered(false)
    }
  }

  const toggleCollapse = () => {
    setIsCollapsedState((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {}
      return next
    })
    setIsHovered(false)
  }

  const setHovered = (hovered: boolean) => {
    if (isCollapsed) {
      setIsHovered(hovered)
    }
  }

  // If sidebar is not collapsed, it's always expanded.
  // If it IS collapsed, it expands when hovered.
  const isExpanded = !isCollapsed || isHovered

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isHovered,
        isExpanded,
        toggleCollapse,
        setIsCollapsed,
        setHovered,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    return {
      isCollapsed: false,
      isHovered: false,
      isExpanded: true,
      toggleCollapse: () => {},
      setIsCollapsed: () => {},
      setHovered: () => {},
    }
  }
  return context
}
