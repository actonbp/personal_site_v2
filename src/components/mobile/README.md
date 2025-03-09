# Mobile Optimization Components

This directory contains components designed to optimize your Three.js/React Three Fiber application for mobile devices. All mobile components are centralized here for better organization and maintainability.

## Usage

Import mobile components from the central export:

```jsx
import { 
  MobileOptimizer, 
  MobileSupport, 
  MobileViewport 
} from '@/components/mobile'
```

## Components

### MobileOptimizedCanvas

The main component that wraps your Three.js scene with mobile optimizations. Use this instead of the regular `Canvas` component from `@react-three/fiber`.

```jsx
import MobileOptimizedCanvas from '@/components/mobile/MobileOptimizedCanvas'

export default function MyScene() {
  return (
    <MobileOptimizedCanvas
      camera={{ position: [0, 0, 10], fov: 60 }}
      enableOrbitControls={true}
      enableTouchControls={true}
    >
      {/* Your Three.js scene components */}
    </MobileOptimizedCanvas>
  )
}
```

### Individual Components

All components are exported from the central index.ts file. Available components:

- **MobileThreeSupport**: Optimizes Three.js renderer and scene for mobile performance
- **MobileTouchControls**: Adds custom touch controls for mobile devices
- **MobileOrbitControls**: Enhanced OrbitControls for mobile touch interactions
- **MobileViewport**: Sets up proper viewport meta tags for mobile
- **MobilePaper**: Enhances paper interactions for mobile devices
- **MobileSupport**: Orchestrates multiple mobile optimizations in one component
- **MobileOptimizer**: Optimizes Three.js rendering for mobile performance
- **MobileTourButton**: Provides a tour button optimized for mobile

## Shared Utilities

Mobile detection is now centralized in the utils.ts file:

```typescript
import { isMobileDevice } from '@/lib/utils'

// Check if on mobile
if (isMobileDevice()) {
  // Mobile-specific code
}
```

## Setup Instructions

### 1. Add Mobile Meta Tags

Add the following to your HTML head:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#000000">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<script src="/mobile-init.js"></script>
```

### 2. Add Mobile Initialization Script

Include the `mobile-init.js` script in your public directory.

### 3. Use the Components

Either use the `MobileOptimizedCanvas` component or add the individual components to your scene:

```jsx
import { Canvas } from '@react-three/fiber'
import MobileThreeSupport from '@/components/mobile/MobileThreeSupport'
import MobileTouchControls from '@/components/mobile/MobileTouchControls'

export default function MyScene() {
  return (
    <Canvas>
      {/* Your Three.js scene components */}
      <MobileThreeSupport />
      <MobileTouchControls />
    </Canvas>
  )
}
```

## Performance Optimizations

These components apply the following optimizations for mobile:

- Reduced pixel ratio for better performance
- Optimized texture quality
- Reduced particle count
- Disabled shadows or reduced shadow quality
- Optimized material settings
- Performance monitoring with adaptive quality
- Touch-friendly controls
- Proper viewport settings

## Browser Compatibility

Tested and optimized for:
- iOS Safari
- Chrome for Android
- Firefox for Android
- Samsung Internet 