# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

A 3D interactive portfolio built with React, TypeScript, and Three.js ecosystem.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling and dev server
- **Three.js** via `@react-three/fiber` (R3F) and `@react-three/drei`
- **@react-spring/three** for physics-based 3D animations
- **GSAP** for timeline-based animations
- **Howler** for audio playback
- **Zustand** for state management

## Commands

```bash
npm run dev      # Start dev server with HMR
npm run build    # Type-check then build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture Notes

### React Three Fiber (R3F)
- Use `<Canvas>` as the root 3D container
- R3F components use camelCase props that map to Three.js properties
- Use hooks like `useFrame` for render loops, `useThree` for scene access
- Drei provides pre-built helpers (OrbitControls, Text, Environment, etc.)

### Project Structure
```
src/
├── components/
│   ├── canvas/    # Componentes 3D (Scene, Box, etc.)
│   └── ui/        # Componentes 2D (Loader, overlays)
├── stores/        # Zustand stores
├── hooks/         # Custom hooks
└── utils/         # Utilidades
```

### State Management
- Zustand stores in `src/stores/` with naming `useXxxStore.ts`
- Access state with hooks: `const value = useStore((state) => state.value)`

### Animation Patterns
- Use `@react-spring/three` for declarative 3D animations within R3F
- Use GSAP for complex sequenced animations and scroll-triggered effects
- Prefer `useSpring` from react-spring for simple transitions

### Audio
- Howler.js handles audio - create Howl instances for sound effects
- Consider user interaction requirements for audio autoplay policies
