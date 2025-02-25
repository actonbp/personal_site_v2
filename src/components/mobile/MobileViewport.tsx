"use client"

import { useEffect } from 'react'

export default function MobileViewport() {
  useEffect(() => {
    // Check if viewport meta tag exists
    let viewportMeta = document.querySelector('meta[name="viewport"]')
    
    // If it doesn't exist, create it
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta')
      viewportMeta.setAttribute('name', 'viewport')
      document.head.appendChild(viewportMeta)
    }
    
    // Set appropriate viewport settings for mobile
    viewportMeta.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    )
    
    // Add additional meta tags for mobile
    const touchIconLink = document.createElement('link')
    touchIconLink.setAttribute('rel', 'apple-touch-icon')
    touchIconLink.setAttribute('href', '/apple-touch-icon.png') // You'll need to create this icon
    document.head.appendChild(touchIconLink)
    
    // Add mobile-specific styles
    const style = document.createElement('style')
    style.textContent = `
      body {
        overscroll-behavior: none;
        touch-action: none;
        -webkit-overflow-scrolling: touch;
        overflow: hidden;
        position: fixed;
        width: 100%;
        height: 100%;
      }
      
      /* Prevent text selection on mobile */
      * {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        user-select: none;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      // Cleanup if needed
      document.head.removeChild(style)
    }
  }, [])
  
  return null
} 