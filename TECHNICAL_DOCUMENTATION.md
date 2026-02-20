# Portfolio 3D Interactivo - Documentación Técnica

## Índice
1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
4. [Estructura de Archivos](#estructura-de-archivos)
5. [Componentes Principales](#componentes-principales)
6. [Sistema de Estado (Zustand)](#sistema-de-estado-zustand)
7. [Sistema de Iluminación](#sistema-de-iluminación)
8. [Shaders Personalizados](#shaders-personalizados)
9. [Post-Processing](#post-processing)
10. [Sistema Orbital 3D](#sistema-orbital-3d)
11. [Animaciones](#animaciones)
12. [Flujo de Navegación](#flujo-de-navegación)
13. [Consideraciones de Rendimiento](#consideraciones-de-rendimiento)
14. [Problemas Conocidos y Soluciones](#problemas-conocidos-y-soluciones)

---

## Visión General

Portfolio personal con metáfora de **sistema solar 3D**:
- **Centro**: Nombre "JUAN B." como texto 3D flotante con glow radial
- **Planetas**: 5 secciones del portfolio orbitando en 3D con inclinaciones únicas
- **Navegación**: Click en planetas para abrir paneles de contenido
- **Estética**: Cinematográfica, oscura, con acentos de color indigo/violeta

### Concepto Visual
```
                    ★ ★ ★ (partículas/estrellas)
                         
        [PROYECTOS]          [CONTACTO]
              \                  /
               \   JUAN B.     /
                \  ~~~~~~~~   /
         [HABILIDADES]    [SOBRE MÍ]
                    \      /
                 [EXPERIENCIA]
```

---

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.2.0 | UI Framework |
| TypeScript | 5.9.3 | Type safety |
| Three.js | 0.182.0 | Motor 3D |
| @react-three/fiber | 9.5.0 | React renderer para Three.js |
| @react-three/drei | 10.7.7 | Helpers y componentes 3D |
| @react-three/postprocessing | 3.0.4 | Efectos visuales |
| @react-spring/three | 10.0.3 | Animaciones físicas |
| Zustand | 5.0.11 | State management |
| Vite | 7.3.1 | Build tool |
| postprocessing | 6.38.2 | Biblioteca de efectos |

---

## Arquitectura del Proyecto

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Canvas (R3F)                        │  │
│  │  camera: [0, 4, 12], fov: 50                          │  │
│  │  physicallyCorrectLights: true                        │  │
│  │  toneMapping: ACESFilmic                              │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │                   Scene.tsx                      │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐               │  │  │
│  │  │  │  Lighting   │  │  Particles  │               │  │  │
│  │  │  └─────────────┘  └─────────────┘               │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐               │  │  │
│  │  │  │  HeroText   │  │  NavShapes  │               │  │  │
│  │  │  │  (JUAN B.)  │  │  (Planetas) │               │  │  │
│  │  │  └─────────────┘  └─────────────┘               │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐               │  │  │
│  │  │  │ SectionPanel│  │ RadialGlow  │               │  │  │
│  │  │  └─────────────┘  └─────────────┘               │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐               │  │  │
│  │  │  │   Effects   │  │OrbitControls│               │  │  │
│  │  │  └─────────────┘  └─────────────┘               │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Estructura de Archivos

```
src/
├── App.tsx                     # Entry point, Canvas setup
├── App.css                     # Estilos globales
├── components/
│   └── canvas/
│       ├── index.ts            # Barrel exports
│       ├── Scene.tsx           # Escena principal (composición)
│       ├── HeroText.tsx        # Texto 3D "JUAN B." central
│       ├── NavShapes.tsx       # Planetas orbitantes (navegación)
│       ├── NavShapes.css       # Estilos para labels HTML
│       ├── Icons3D.tsx         # Iconos 3D para cada sección
│       ├── Particles.tsx       # Campo de estrellas/partículas
│       ├── SectionPanel.tsx    # Panel de contenido al seleccionar
│       ├── RadialGlow.tsx      # Shader de glow radial (HUD)
│       ├── Effects.tsx         # Post-processing (Bloom, Vignette)
│       └── SunVolumetric.tsx   # [DEPRECATED - no usado actualmente]
└── stores/
    └── useAppStore.ts          # Estado global (Zustand)
```

---

## Componentes Principales

### 1. App.tsx
**Propósito**: Configuración del Canvas de Three.js

```typescript
// Configuración crítica del renderer
gl.physicallyCorrectLights = true    // Luces con decay físico real
gl.toneMappingExposure = 1.0         // Exposición de cámara
gl.toneMapping = 3                   // ACESFilmicToneMapping (look cinematográfico)
```

**Posición de cámara**: `[0, 4, 12]` - Ligeramente elevada, mirando hacia el origen

### 2. Scene.tsx
**Propósito**: Composición de toda la escena 3D

**Jerarquía de renderizado**:
1. `<Selection>` - Wrapper para bloom selectivo (de postprocessing)
2. Iluminación (ambient + directional + point lights)
3. Fondo + Fog
4. Partículas (estrellas)
5. HeroText (texto central)
6. NavShapes (planetas)
7. SectionPanel (panel de contenido)
8. RadialGlow (overlay de glow)
9. Effects (post-processing)
10. OrbitControls (controles de cámara)

**Sistema de iluminación**:
```typescript
// Luz ambiente base (muy baja para look cinematográfico)
<ambientLight intensity={0.15} />

// Luces direccionales (key light + fill light)
<directionalLight position={[10, 10, 5]} intensity={0.8} />
<directionalLight position={[-10, -5, -10]} intensity={0.2} />

// Luz central para el texto (punto focal)
<pointLight position={[0, 0, 4]} intensity={2.5} color="#ffffff" distance={15} decay={2} />
<pointLight position={[0, 1, 3]} intensity={1.2} color="#a5b4fc" distance={10} decay={2} />

// Luces de acento coloreadas para los planetas
<pointLight position={[-8, 3, -5]} intensity={0.6} color="#ec4899" /> // Rosa
<pointLight position={[8, -3, -5]} intensity={0.6} color="#14b8a6" />  // Teal
```

### 3. HeroText.tsx
**Propósito**: Texto 3D "JUAN B." con animaciones

**Estructura**:
```
animated.group (scale, positionY animados)
└── Float (flotación sutil automática)
    └── group (rotación manual en useFrame)
        ├── Center > Text3D "JUAN B."
        ├── mesh (línea decorativa)
        └── Center > Text3D "CREATIVE DEVELOPER"
```

**Propiedades del texto principal**:
- `size`: 0.9
- `height`: 0.25 (profundidad 3D)
- `bevelEnabled`: true
- Material: blanco con emissive indigo sutil

**Animaciones**:
- `useSpring`: scale (0.8 → 1), positionY (2 → 0) al mostrar/ocultar
- `useFrame`: rotación Y/X sinusoidal continua para mostrar profundidad

**Visibilidad**: Se oculta cuando `isNavigating || currentSection`

### 4. NavShapes.tsx
**Propósito**: Sistema de planetas orbitantes

**Configuración orbital por planeta**:
```typescript
const orbitConfig = [
  { radius: 2.8, speed: 0.35, incX: 0.4,  incZ: 0.2,  startAngle: 0 },           // About
  { radius: 3.8, speed: 0.28, incX: -0.6, incZ: 0.8,  startAngle: π*0.4 },       // Projects
  { radius: 4.8, speed: 0.22, incX: 0.15, incZ: -0.1, startAngle: π*0.9 },       // Skills
  { radius: 5.8, speed: 0.16, incX: 0.7,  incZ: -0.5, startAngle: π*1.3 },       // Experience
  { radius: 7.0, speed: 0.1,  incX: -0.3, incZ: 0.4,  startAngle: π*1.7 },       // Contact
]
```

**Cálculo de posición orbital 3D**:
```typescript
// En useFrame:
const angle = startAngle + time * orbitSpeed
const baseX = Math.cos(angle) * orbitRadius
const baseZ = Math.sin(angle) * orbitRadius

// Aplicar inclinaciones en diferentes ejes
position.x = baseX
position.z = baseZ * Math.cos(incZ) 
position.y = baseZ * Math.sin(incX) + baseX * Math.sin(incZ) * 0.3
```

**Interacción**:
- `onPointerOver`: hover state + cursor pointer
- `onClick`: navegar a sección
- Label HTML flotante debajo de cada planeta

**Multiplicador de radio**: `orbitConfig[index].radius * 1.3` (30% más lejos del centro)

### 5. Icons3D.tsx
**Propósito**: Iconos 3D temáticos para cada sección

| Sección | Icono | Descripción |
|---------|-------|-------------|
| about | PersonIcon | Cabeza + cuerpo (capsule) |
| projects | CodeIcon | Brackets `</>` |
| skills | GearIcon | Engranaje con dientes |
| experience | BriefcaseIcon | Maletín con asa |
| contact | EnvelopeIcon | Sobre de carta |

**Props comunes**:
- `color`: Color del planeta
- `hovered`: Boolean para emissive intensity

**Todos rotan en Y** con `useFrame` a velocidad 0.5 rad/s

### 6. SectionPanel.tsx
**Propósito**: Panel de contenido cuando se selecciona una sección

**Estructura**:
```
animated.group (scale, rotation animados)
├── FloatingIcon (icono de la sección arriba, rotando)
├── group (panel principal)
│   ├── RoundedBox (fondo oscuro transparente)
│   ├── RoundedBox (borde brillante con color de sección)
│   ├── Text (título)
│   ├── mesh (línea decorativa)
│   └── Text[] (contenido línea por línea)
├── BackButton (botón "← VOLVER")
└── PanelParticles (partículas decorativas girando)
```

**Tamaño responsivo**:
```typescript
const panelWidth = Math.min(viewport.width * 0.6, 4)
const panelHeight = Math.min(viewport.height * 0.5, 3)
```

**Animación de entrada**: Rotación desde Math.PI a 0 + scale de 0 a 1

### 7. Particles.tsx
**Propósito**: Campo de estrellas de fondo

**Configuración**:
- `count`: 1200 partículas
- Distribución: esfera con radio 15-40 unidades
- Material: `AdditiveBlending`, blanco, opacity 0.6
- Rotación continua lenta del campo completo

**Generación**:
```typescript
// Coordenadas esféricas aleatorias
const radius = 15 + Math.random() * 25
const theta = Math.random() * Math.PI * 2
const phi = Math.acos(2 * Math.random() - 1)

positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
positions[i * 3 + 2] = radius * Math.cos(phi)
```

---

## Sistema de Estado (Zustand)

### useAppStore.ts

```typescript
interface AppState {
  currentSection: string | null    // ID de sección activa (null = home)
  isNavigating: boolean            // Flag de transición
  hoveredSection: string | null    // Sección con hover
  
  setCurrentSection: (section: string | null) => void
  setHoveredSection: (section: string | null) => void
  navigateTo: (section: string) => void  // Inicia navegación
  goHome: () => void                      // Vuelve al home
}
```

**Secciones definidas**:
```typescript
export const sections: Section[] = [
  { id: 'about',      name: 'Sobre Mí',     color: '#6366f1', geometry: 'octahedron' },
  { id: 'projects',   name: 'Proyectos',    color: '#ec4899', geometry: 'dodecahedron' },
  { id: 'skills',     name: 'Habilidades',  color: '#14b8a6', geometry: 'torus' },
  { id: 'experience', name: 'Experiencia',  color: '#f59e0b', geometry: 'box' },
  { id: 'contact',    name: 'Contacto',     color: '#22c55e', geometry: 'sphere' },
]
```

**Flujo de estado**:
```
HOME (currentSection=null)
    │
    ▼ navigateTo('about')
    │
NAVIGATING (isNavigating=true, currentSection='about')
    │
    ▼ Animaciones se completan
    │
SECTION ACTIVE (isNavigating=false, currentSection='about')
    │
    ▼ goHome()
    │
HOME (currentSection=null, isNavigating=false)
```

---

## Sistema de Iluminación

### Filosofía
Look **cinematográfico oscuro** con acentos de color. La iluminación usa:
- `physicallyCorrectLights: true` para decay realista
- `ACESFilmicToneMapping` para contraste de película

### Luces en Scene.tsx

| Tipo | Posición | Intensidad | Color | Propósito |
|------|----------|------------|-------|-----------|
| Ambient | - | 0.15 | blanco | Base mínima |
| Directional | [10,10,5] | 0.8 | blanco | Key light |
| Directional | [-10,-5,-10] | 0.2 | blanco | Fill light |
| Point | [0,0,4] | 2.5 | #ffffff | Ilumina texto |
| Point | [0,1,3] | 1.2 | #a5b4fc | Acento indigo |
| Point | [-8,3,-5] | 0.6 | #ec4899 | Acento rosa |
| Point | [8,-3,-5] | 0.6 | #14b8a6 | Acento teal |

### Fog
```typescript
<fog attach="fog" args={['#020206', 12, 35]} />
```
- Color: casi negro (#020206)
- Near: 12 unidades
- Far: 35 unidades
- Efecto: desvanece objetos lejanos gradualmente

---

## Shaders Personalizados

### RadialGlow.tsx - Shader de Glow Radial

**Propósito**: Overlay fullscreen con glow suave emanando del centro

**Uniforms**:
```glsl
uniform vec3 uColor1;      // Color centro (#818cf8 - indigo claro)
uniform vec3 uColor2;      // Color bordes (#312e81 - indigo oscuro)
uniform float uIntensity;  // Intensidad global (0-0.35)
uniform float uTime;       // Tiempo para animación
```

**Fragment Shader**:
```glsl
void main() {
  vec2 center = vec2(0.5);
  float dist = distance(vUv, center);
  
  // Capa principal - decay exponencial suave
  float glow1 = exp(-dist * 2.5) * 0.6;
  
  // Capa secundaria - más concentrada
  float glow2 = exp(-dist * 5.0) * 0.4;
  
  // Pulso sutil
  float pulse = sin(uTime * 0.5) * 0.05 + 1.0;
  
  // Mezcla de colores basada en distancia
  vec3 col = mix(uColor1, uColor2, dist * 1.5);
  
  // Intensidad final
  float alpha = (glow1 + glow2) * uIntensity * pulse;
  
  gl_FragColor = vec4(col * alpha, alpha * 0.7);
}
```

**Renderizado**:
- Usa `<Hud>` de drei para renderizar sobre la escena
- Plano 2x2 en NDC (cubre toda la pantalla)
- `AdditiveBlending` para sumar luz
- `depthWrite: false` para no afectar depth buffer

**Comportamiento**:
- `currentSection = null`: intensidad 0.35 (visible)
- `currentSection = algo`: intensidad 0 (oculto)
- Transición suave con `MathUtils.lerp`

---

## Post-Processing

### Effects.tsx

**Efectos activos**:

1. **Bloom**
   ```typescript
   <Bloom
     intensity={0.35}           // Cuando no hay sección
     luminanceThreshold={0.7}   // Solo afecta pixels muy brillantes
     luminanceSmoothing={0.9}   // Transición suave
   />
   ```
   - Se desactiva (intensity=0) cuando hay sección abierta

2. **Vignette**
   ```typescript
   <Vignette 
     offset={0.35} 
     darkness={0.5} 
     blendFunction={BlendFunction.NORMAL} 
   />
   ```
   - Oscurece bordes de pantalla
   - Look cinematográfico

3. **Chromatic Aberration**
   ```typescript
   <ChromaticAberration
     offset={new Vector2(0.0002, 0.0002)}
     blendFunction={BlendFunction.NORMAL}
   />
   ```
   - Muy sutil (0.0002)
   - Añade imperfección realista de lente

**IMPORTANTE**: No usar `ref` en Bloom ni `mipmapBlur` - causa errores de serialización circular.

---

## Sistema Orbital 3D

### Matemáticas del movimiento

Cada planeta tiene órbita 3D única definida por:
- `radius`: Distancia al centro
- `speed`: Velocidad angular (rad/s)
- `incX`: Inclinación en eje X
- `incZ`: Inclinación en eje Z
- `startAngle`: Ángulo inicial

**Fórmula de posición**:
```typescript
const angle = startAngle + time * speed
const baseX = Math.cos(angle) * radius
const baseZ = Math.sin(angle) * radius

// Transformación 3D
x = baseX
z = baseZ * cos(incZ)
y = baseZ * sin(incX) + baseX * sin(incZ) * 0.3
```

**Efecto visual**: Cada planeta orbita en un plano diferente, creando profundidad real.

### Visualización de órbitas

```
Vista desde arriba (Y+):        Vista lateral (X+):
                                    
    ○ - - ○                           ○
   /       \                         /
  ○    ☀    ○                    ☀ - - ○
   \       /                         \
    ○ - - ○                           ○
```

---

## Animaciones

### Bibliotecas usadas
- **@react-spring/three**: Animaciones basadas en física para Three.js
- **useFrame**: Animaciones imperativas cada frame

### Patrones de animación

1. **Entrada/Salida de componentes** (react-spring):
   ```typescript
   const { scale, positionY } = useSpring({
     scale: isHidden ? 0.8 : 1,
     positionY: isHidden ? 2 : 0,
     config: { mass: 1, tension: 170, friction: 26 }
   })
   ```

2. **Movimiento continuo** (useFrame):
   ```typescript
   useFrame((state) => {
     mesh.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.08
   })
   ```

3. **Interpolación de valores** (MathUtils.lerp):
   ```typescript
   useFrame(() => {
     material.uIntensity = MathUtils.lerp(current, target, 0.08)
   })
   ```

### Config de springs comunes

| Uso | mass | tension | friction |
|-----|------|---------|----------|
| UI rápida | 1 | 200 | 20 |
| Texto hero | 1 | 170 | 26 |
| Panel entrada | 2 | 120 | 20 |
| Hover wobbly | config.wobbly | - | - |

---

## Flujo de Navegación

```
┌────────────────────────────────────────────────────────┐
│                      HOME STATE                         │
│  - HeroText visible                                     │
│  - Planetas orbitando                                   │
│  - RadialGlow activo (0.35)                            │
│  - Bloom activo (0.35)                                  │
│  - AutoRotate cámara activo                            │
└────────────────────────────────────────────────────────┘
                          │
                          │ Click en planeta
                          ▼
┌────────────────────────────────────────────────────────┐
│                   NAVIGATING STATE                      │
│  - isNavigating = true                                  │
│  - currentSection = 'about' (ejemplo)                   │
│  - Planetas comienzan animación de salida              │
│  - HeroText comienza a ocultarse                       │
└────────────────────────────────────────────────────────┘
                          │
                          │ Animaciones completas
                          ▼
┌────────────────────────────────────────────────────────┐
│                   SECTION STATE                         │
│  - HeroText oculto (scale 0.8, y=2)                    │
│  - Planetas ocultos (exitScale = 0)                    │
│  - SectionPanel visible con animación                  │
│  - RadialGlow oculto (intensity = 0)                   │
│  - Bloom oculto (intensity = 0)                        │
│  - AutoRotate desactivado                              │
│  - Zoom desactivado                                     │
└────────────────────────────────────────────────────────┘
                          │
                          │ Click "← VOLVER"
                          ▼
                    goHome() → HOME STATE
```

---

## Consideraciones de Rendimiento

### Optimizaciones implementadas

1. **useMemo** para datos estáticos:
   - Posiciones de partículas
   - Configuraciones de órbitas

2. **Conditional rendering**:
   - SectionPanel solo se renderiza si `currentSection`
   - Labels HTML solo si no `isExiting`

3. **PointsMaterial** para partículas:
   - 1200 partículas como single draw call
   - `sizeAttenuation` para perspectiva correcta

4. **Bloom threshold alto** (0.7):
   - Solo afecta pixels muy brillantes
   - Reduce carga de GPU

### Posibles mejoras futuras

1. Usar `instancedMesh` para partículas decorativas del panel
2. Implementar LOD para iconos 3D a distancia
3. Reducir complejidad de geometrías (bevels)
4. Usar `Suspense` para carga de fuente Text3D

---

## Problemas Conocidos y Soluciones

### 1. Error de serialización circular con Bloom

**Problema**: Usar `ref` en `<Bloom>` y animarlo con `useFrame` causa:
```
TypeError: Converting circular structure to JSON
--> starting at object with constructor 'KawaseBlurPass'
```

**Solución**: No usar `ref` en Bloom. Cambiar intensidad directamente por prop:
```typescript
const bloomIntensity = currentSection ? 0 : 0.35
<Bloom intensity={bloomIntensity} />
```

### 2. Texto oculto por geometría del sol

**Problema**: Esfera del "sol" tapaba el texto "JUAN B."

**Solución**: Eliminar SunVolumetric, usar solo RadialGlow (shader 2D) + iluminación.

### 3. WebGL context lost

**Problema**: Ocasionalmente el contexto WebGL se pierde.

**Solución**: Handler en App.tsx que recarga la página:
```typescript
gl.domElement.addEventListener('webglcontextlost', (e) => {
  e.preventDefault()
  window.location.reload()
})
```

### 4. Glow no abarca toda la pantalla

**Problema**: Glow radial terminaba abruptamente.

**Solución**: Usar `exp(-dist * 2.5)` en shader para decay exponencial suave que llega hasta los bordes.

---

## Paleta de Colores

| Nombre | Hex | Uso |
|--------|-----|-----|
| Background | #020206 | Fondo principal |
| Indigo 500 | #6366f1 | Color primario (about, líneas) |
| Indigo 300 | #a5b4fc | Acentos claros, emissive texto |
| Indigo 400 | #818cf8 | RadialGlow color1 |
| Indigo 900 | #312e81 | RadialGlow color2 |
| Pink 500 | #ec4899 | Proyectos |
| Teal 500 | #14b8a6 | Habilidades |
| Amber 500 | #f59e0b | Experiencia |
| Green 500 | #22c55e | Contacto |

---

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview

# Linting
npm run lint
```

---

## Notas para Otros Agentes IA

1. **No modificar Effects.tsx** con refs animados - causa crashes
2. **El estado está en Zustand** - revisar `useAppStore.ts` primero
3. **RadialGlow es un shader GLSL** - modificar con cuidado
4. **Los planetas NO tienen anillos visibles** - es intencional
5. **El texto está en posición [0,0,0]** - el glow es un overlay 2D separado
6. **physicallyCorrectLights** afecta intensidades - multiplicadores más altos necesarios
7. **ACESFilmicToneMapping** comprime highlights - colores pueden verse diferentes

---

*Última actualización: Febrero 2026*
*Versión del documento: 1.0*
