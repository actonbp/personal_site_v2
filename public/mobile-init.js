// Mobile initialization script - to be included in the head
(function() {
  // Check if we're on a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Set up viewport meta tag
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    
    // Add mobile-specific meta tags
    const metaTags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'theme-color', content: '#000000' }
    ];
    
    metaTags.forEach(tag => {
      if (!document.querySelector(`meta[name="${tag.name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = tag.name;
        meta.content = tag.content;
        document.head.appendChild(meta);
      }
    });
    
    // Add touch icon
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      link.href = '/apple-touch-icon.png';
      document.head.appendChild(link);
    }
    
    // Add mobile-specific styles
    const style = document.createElement('style');
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
      
      * {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        user-select: none;
      }
      
      canvas {
        touch-action: none;
      }
    `;
    document.head.appendChild(style);
    
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
    
    // Optimize performance by reducing pixel ratio on high-DPI devices
    if (window.devicePixelRatio > 2) {
      window.devicePixelRatio = 2; // Will be picked up by Three.js renderer
    }
    
    // Add mobile class to body
    document.body.classList.add('mobile-device');
    
    console.log('Mobile optimizations applied');
  }
})(); 