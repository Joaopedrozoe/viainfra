
import { useState, useEffect, useMemo, useCallback } from "react"

const MOBILE_BREAKPOINT = 768
const RESIZE_THROTTLE_MS = 150

export function useIsMobile() {
  const [width, setWidth] = useState<number | undefined>(undefined)

  // Throttle function to limit resize events
  const throttle = useCallback((callback: Function, limit: number) => {
    let waiting = false
    return function() {
      if (!waiting) {
        callback.apply(this, arguments)
        waiting = true
        setTimeout(() => {
          waiting = false
        }, limit)
      }
    }
  }, [])
  
  useEffect(() => {
    // Set initial width
    setWidth(window.innerWidth)
    
    // Throttled resize handler
    const handleResize = throttle(() => {
      setWidth(window.innerWidth)
    }, RESIZE_THROTTLE_MS)
    
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [throttle])

  // Memoize the result to avoid recalculations
  const isMobile = useMemo(() => {
    return typeof width === 'number' && width < MOBILE_BREAKPOINT
  }, [width])

  return isMobile
}
