// Mobile support script
(function() {
  // Check if we're on a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Prevent pinch zoom on iOS Safari
    document.addEventListener('touchmove', function(event) {
      if (event.scale !== 1) {
        event.preventDefault();
      }
    }, { passive: false });
    
    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
    
    // Add viewport meta tag if it doesn't exist
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    }
    
    // Add mobile class to body
    document.body.classList.add('mobile');
    
    // Add mobile-specific styles
    const style = document.createElement('style');
    style.textContent = `
      body.mobile {
        overscroll-behavior: none;
        touch-action: none;
        -webkit-overflow-scrolling: touch;
        position: fixed;
        width: 100%;
        height: 100%;
      }
      
      body.mobile * {
        -webkit-tap-highlight-color: transparent;
      }
    `;
    document.head.appendChild(style);
    
    // Optimize performance by reducing pixel ratio on high-DPI devices
    if (window.devicePixelRatio > 2) {
      // Will be picked up by Three.js renderer
      window.devicePixelRatio = 2;
    }
  }
})(); 