# 🚀 Lab Portfolio - Documentación Técnica Completa

## Índice
1. [Descripción General](#descripción-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Arquitectura de la Aplicación](#arquitectura-de-la-aplicación)
5. [Componentes Detallados](#componentes-detallados)
6. [Sistema de Controles](#sistema-de-controles)
7. [Sistema Multijugador](#sistema-multijugador)
8. [Guía de Instalación y Desarrollo](#guía-de-instalación-y-desarrollo)

---

## Descripción General

**Lab Portfolio** es un portfolio web inmersivo con temática espacial donde el usuario pilota una nave espacial a través del espacio para explorar diferentes secciones del portfolio (Sobre Mí, Proyectos, Habilidades, Tecnologías, Contacto) representadas como planetas.

### Características Principales
- 🎮 **Pilotaje de nave espacial** con controles estilo FPS (WASD + mouse)
- 🌍 **Planetas navegables** que representan secciones del portfolio
- 👥 **Multijugador PvP** en tiempo real con Firebase
- 🔫 **Sistema de disparos** con láseres y detección de colisiones
- 💥 **Efectos visuales** (warp, explosiones, estela de motor)
- 📱 **Soporte móvil** con joysticks virtuales
- 🎥 **Modo primera/tercera persona** (tecla V)

---

## Stack Tecnológico

### Dependencias Principales

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| **React** | 19.2.0 | Framework UI |
| **Three.js** | 0.182.0 | Motor gráfico 3D |
| **@react-three/fiber** | 9.5.0 | React renderer para Three.js |
| **@react-three/drei** | 10.7.7 | Helpers y componentes útiles para R3F |
| **@react-three/postprocessing** | 3.0.4 | Efectos de post-procesado |
| **@react-spring/three** | 10.0.3 | Animaciones basadas en física |
| **Zustand** | 5.0.11 | Estado global |
| **Firebase** | 12.9.0 | Backend para multijugador |
| **TypeScript** | 5.9.3 | Tipado estático |
| **Vite** | 7.3.1 | Build tool y dev server |

---

## Estructura del Proyecto

```
lab-portfolio/
├── public/
│   └── models/
│       └── scene.gltf          # Modelo 3D de la nave (low-poly)
├── src/
│   ├── components/
│   │   ├── canvas/             # Componentes 3D (Three.js)
│   │   │   ├── index.ts        # Exportaciones del módulo
│   │   │   ├── Scene.tsx       # Escena principal
│   │   │   ├── Ship.tsx        # Nave del jugador
│   │   │   ├── ShipTrail.tsx   # Estela de la nave
│   │   │   ├── NavShapes.tsx   # Planetas de navegación
│   │   │   ├── HeroText.tsx    # Texto 3D "JUAN B."
│   │   │   ├── Particles.tsx   # Estrellas de fondo
│   │   │   ├── WarpEffect.tsx  # Efecto de salto warp
│   │   │   ├── LaserSystem.tsx # Sistema de disparos
│   │   │   ├── Laser.tsx       # Proyectil láser individual
│   │   │   ├── MultiplayerManager.tsx  # Gestión multijugador
│   │   │   ├── OtherShips.tsx  # Naves de otros jugadores
│   │   │   ├── Explosion.tsx   # Efecto de explosión
│   │   │   ├── ProjectsSection.tsx    # Sección de proyectos
│   │   │   ├── SectionPanel.tsx       # Paneles de contenido
│   │   │   ├── PlanetEnvironment.tsx  # Ambiente interior de planetas
│   │   │   ├── SpaceCockpit.tsx       # Cockpit visual de la nave
│   │   │   ├── Effects.tsx     # Post-processing
│   │   │   ├── RadialGlow.tsx  # Efecto de brillo central
│   │   │   ├── Icons3D.tsx     # Iconos 3D para planetas
│   │   │   ├── FloatingShapes.tsx     # Formas decorativas
│   │   │   └── Box.tsx         # Componente de prueba
│   │   └── ui/                 # Componentes de interfaz 2D
│   │       ├── CockpitHUD.tsx  # HUD del cockpit
│   │       ├── CockpitHUD.css  # Estilos del HUD
│   │       ├── DeathScreen.tsx # Pantalla de muerte
│   │       ├── DeathScreen.css # Estilos muerte
│   │       ├── MobileControls.tsx  # Joysticks móviles
│   │       ├── MobileControls.css  # Estilos móviles
│   │       ├── Loader.tsx      # Pantalla de carga
│   │       └── Loader.css      # Estilos loader
│   ├── hooks/
│   │   ├── useShipControls.ts  # Controles de la nave
│   │   └── useMultiplayer.ts   # Lógica multijugador
│   ├── stores/
│   │   ├── useAppStore.ts      # Estado global (Zustand)
│   │   └── index.ts            # Exportaciones
│   ├── lib/
│   │   └── firebase.ts         # Configuración Firebase
│   ├── types/
│   │   └── multiplayer.ts      # Tipos TypeScript
│   ├── App.tsx                 # Componente raíz
│   ├── App.css                 # Estilos globales
│   ├── main.tsx                # Punto de entrada
│   └── index.css               # Reset CSS
├── package.json
├── tsconfig.json
├── vite.config.ts
└── DOCUMENTATION.md            # Este archivo
```

---

## Arquitectura de la Aplicación

### Flujo de Datos

```
                    ┌─────────────────┐
                    │   useAppStore   │  ← Estado Global (Zustand)
                    │  (Estado Global)│
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────┐  ┌──────────────────┐
│  useShipControls│  │useMultiplayer│  │   Componentes    │
│   (Controles)   │  │ (Firebase)  │  │    React/R3F     │
└─────────────────┘  └─────────────┘  └──────────────────┘
```

### Estado Global (useAppStore)

El store de Zustand maneja todo el estado de la aplicación:

```typescript
interface AppState {
  // Navegación
  currentSection: string | null      // Sección activa (about, projects, etc.)
  pendingSection: string | null      // Sección destino durante warp
  isNavigating: boolean              // En proceso de navegación
  isWarping: boolean                 // Efecto warp activo
  hoveredSection: string | null      // Planeta con hover
  
  // Cámara
  isThirdPerson: boolean             // Modo de vista
  
  // Sistema de disparos
  lasers: LaserShot[]                // Láseres activos
  
  // Multiplayer
  playerId: string | null            // ID único del jugador
  roomId: string | null              // Sala actual
  isConnected: boolean               // Estado de conexión
  otherPlayers: Map<string, OtherPlayer>  // Otros jugadores
  isDead: boolean                    // Estado de muerte
  killedBy: string | null            // Quién te mató
  explosions: ExplosionData[]        // Explosiones activas
  respawnPosition: { x, y, z } | null // Posición de respawn
  
  // Proximidad
  nearbyPlanet: { id, name, color, distance } | null  // Planeta cercano
  
  // Input móvil
  mobileInput: { lookX, lookY, moveY }  // Joysticks virtuales
}
```

---

## Componentes Detallados

### 🎬 Scene.tsx - Escena Principal

El componente raíz de la escena 3D que orquesta todos los elementos:

```tsx
export default function Scene() {
  return (
    <Selection>
      {/* Espacio exterior - visible cuando exploramos */}
      <OuterSpace />           // Estrellas, planetas, texto JUAN B.
      
      {/* Ambiente del planeta - visible al entrar a una sección */}
      <PlanetEnvironment />
      
      {/* Panel de contenido de la sección */}
      <SectionPanel />
      
      {/* Sección de proyectos con satélites */}
      <ProjectsSection />
      
      {/* Efecto Warp Drive */}
      <WarpContainer />
      
      {/* Nave del jugador */}
      <Ship />
      
      {/* Estela de motor */}
      <ShipTrail />
      
      {/* Sistema de disparos */}
      <LaserSystem />
      
      {/* Sistema Multijugador */}
      <MultiplayerManager />
      
      {/* Post-processing */}
      <Effects />
    </Selection>
  )
}
```

**OuterSpace** (sub-componente) incluye:
- Iluminación ambiental y direccional
- Partículas de fondo (2000 estrellas)
- Texto 3D central "JUAN B."
- Planetas de navegación
- Efecto de glow radial

---

### 🚀 Ship.tsx - Nave del Jugador

Gestiona la nave controlable del jugador con dos modos de vista:

```tsx
// Estructura del componente
export default function Ship() {
  const shipRef = useRef<THREE.Group>(null!)
  
  // Hook que maneja toda la física y controles
  useShipControls(shipRef)
  
  return (
    <>
      {/* Grupo invisible para física y posición */}
      <group ref={shipRef} position={[0, 0, 12]} />
      
      {/* Modelo 3D visible (solo en tercera persona) */}
      <ShipModel shipRef={shipRef} />
      
      {/* Cockpit que sigue la cámara (solo en primera persona) */}
      <CockpitFollower />
    </>
  )
}
```

**CockpitFollower**: Sigue la cámara y muestra el cockpit en primera persona
**ShipModel**: Carga el modelo GLTF y lo muestra en tercera persona

---

### 🎮 useShipControls.ts - Sistema de Controles

Hook principal que maneja toda la física y controles de la nave:

#### Configuración de Física
```typescript
const SHIP_CONFIG = {
  acceleration: 8,           // Velocidad de aceleración
  maxSpeed: 15,              // Velocidad máxima
  rotationSpeed: 1.2,        // Velocidad de rotación
  damping: 0.96,             // Fricción lineal
  angularDamping: 0.90,      // Fricción angular
  boostMultiplier: 2.5,      // Multiplicador con Shift
  planetWarningRadius: 35,   // Radio para warning de planeta
  planetAttractionRadius: 18,// Radio para entrar al planeta
}

const THIRD_PERSON_CONFIG = {
  distance: 8,               // Distancia detrás de la nave
  height: 3,                 // Altura sobre la nave
  smoothing: 0.1,            // Suavizado de cámara
}
```

#### Estado de la Nave
```typescript
interface ShipState {
  position: THREE.Vector3     // Posición en el espacio
  rotation: THREE.Euler       // Rotación (pitch, yaw, roll)
  velocity: THREE.Vector3     // Velocidad lineal
  angularVelocity: THREE.Vector3  // Velocidad angular
}
```

#### Flujo de Control (useFrame loop)
1. Leer inputs (teclado + móvil)
2. Si está en warp → solo actualizar posición
3. Si está en sección → movimiento limitado
4. Aplicar rotación basada en mouse (Pointer Lock)
5. Aplicar roll con Q/E
6. Calcular dirección forward y aplicar aceleración
7. Aplicar damping (fricción)
8. Detectar proximidad a planetas
9. Actualizar posición de nave y cámara

---

### 🌍 NavShapes.tsx - Planetas de Navegación

Define los planetas que representan las secciones del portfolio:

```typescript
// Posiciones de los planetas (alejados 3x del centro)
export const planetPositions: Record<string, THREE.Vector3> = {
  about:      new THREE.Vector3(0, 45, -120),      // Arriba-adelante
  projects:   new THREE.Vector3(-150, -30, -75),   // Izquierda-abajo
  skills:     new THREE.Vector3(150, 15, -90),     // Derecha
  experience: new THREE.Vector3(-90, 75, 60),      // Izquierda-arriba-atrás
  contact:    new THREE.Vector3(105, -60, 75),     // Derecha-abajo-atrás
}
```

Cada planeta incluye:
- Icono 3D específico (de Icons3D.tsx)
- Aura/glow con esfera semitransparente
- Anillo orbital decorativo
- Etiqueta con nombre (Billboard)
- Luz puntual del color del planeta
- Animación de escala al hover

---

### ⚡ WarpEffect.tsx - Efecto de Salto

Efecto visual de "velocidad warp" al viajar a un planeta:

```typescript
// 800 partículas distribuidas en cilindro
// Shader personalizado con:
// - Movimiento hacia la cámara
// - Estiramiento progresivo
// - Colores: blanco, índigo, violeta
// - Blending aditivo
```

**WarpContainer**: Componente wrapper que conecta con el store
- `active` → inicia el efecto
- `onComplete` → callback cuando termina (abre la sección)

---

### 🔫 LaserSystem.tsx - Sistema de Disparos

Gestiona el sistema de disparo de láseres:

```typescript
// Configuración
const COOLDOWN = 10000  // 10 segundos entre disparos
const LASER_SPEED = 45  // Velocidad del proyectil

// Al disparar:
// 1. Obtener posición y dirección de la cámara
// 2. Crear objeto LaserShot con ID único
// 3. Agregar al store
// 4. Renderizar componente <Laser />
```

**Laser.tsx**: Componente individual del proyectil
- Mesh cilíndrico brillante
- Se mueve en su dirección a velocidad constante
- Se elimina después de 3 segundos

---

### 💥 Explosion.tsx - Efectos de Explosión

Efecto visual cuando una nave es destruida:

```typescript
// 30 partículas con direcciones aleatorias
// Duración: 1 segundo
// Cada frame:
// - Mover partículas hacia afuera
// - Reducir escala progresivamente
// - Reducir opacidad
// - Flash central con pointLight
```

---

### 🛸 ShipTrail.tsx - Estela de Motor

Efecto de estela detrás de la nave:

```typescript
const MAX_POINTS = 100        // Máximo de partículas
const POINT_LIFETIME = 2.0    // Vida en segundos
const SPAWN_INTERVAL = 0.02   // Spawn cada 20ms

// Características:
// - Dos "motores" (offset izquierda/derecha)
// - Color: cyan → azul (fade)
// - Más intenso en boost (Shift)
// - Shader personalizado con blending aditivo
```

---

### 📱 CockpitHUD.tsx - Interfaz de Usuario

HUD superpuesto con información y controles:

```
┌────────────────────────────────────────┐
│  [ESC para liberar cursor] [3ª Persona]│  ← Barra superior
├────┬──────────────────────────────┬────┤
│    │                              │CTRL│  ← Panel derecho con controles
│ ▓▓ │         [ + ]               │WASD│
│ ▓▓ │       Retícula              │Q/E │
│    │                              │SHFT│
├────┴──────────────────────────────┴────┤
│  [SPD ████░░]      [PWR ████░░]        │  ← Consola inferior
└────────────────────────────────────────┘

   ⚠️ PROXIMIDAD DETECTADA               ← Warning de planeta
      PROYECTOS
      25.3km
      [████████░░░░]
```

Elementos:
- Marco del cockpit (decorativo)
- Retícula de apuntado central
- Indicadores SPD/PWR (decorativos)
- Guía de controles
- Aviso de Pointer Lock
- Indicador de modo de vista (1ª/3ª persona)
- Warning de proximidad a planetas
- Botón de disparo (solo mobile)

---

### 🎮 MobileControls.tsx - Controles Móviles

Joysticks virtuales para dispositivos táctiles:

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                                         │
│                                         │
│  ┌───────┐                 ┌───────┐   │
│  │  🎯   │                 │  🚀   │   │
│  │ (•)   │                 │ (•)   │   │
│  └───────┘                 └───────┘   │
│  Dirección                 Movimiento   │
└─────────────────────────────────────────┘
```

- **Joystick izquierdo**: Rotación de cámara (lookX, lookY)
- **Joystick derecho**: Movimiento adelante/atrás (moveY)
- Solo visible en dispositivos móviles o pantallas < 768px

---

## Sistema de Controles

### Controles de PC (Pointer Lock)

| Tecla | Acción |
|-------|--------|
| **Click** | Activar control de nave |
| **Mouse** | Rotar cámara/nave |
| **W** | Acelerar hacia adelante |
| **S** | Retroceder |
| **A/D** | Strafe (sin Pointer Lock) |
| **Q** | Barrel roll izquierda |
| **E** | Barrel roll derecha |
| **Shift** | Boost (2.5x velocidad) |
| **Space** | Disparar láser (cooldown 10s) |
| **V** | Alternar vista 1ª/3ª persona |
| **ESC** | Liberar cursor |

### Controles Móviles

- **Joystick izquierdo**: Dirección/cámara
- **Joystick derecho**: Acelerar/retroceder
- **Botón FIRE**: Disparar

---

## Sistema Multijugador

### Arquitectura Firebase

```
Firebase Realtime Database
└── rooms/
    └── room-{1-10}/
        ├── players/
        │   └── {playerId}/
        │       ├── id: string
        │       ├── color: string
        │       ├── position: { x, y, z }
        │       ├── rotation: { x, y, z }
        │       ├── isProtected: boolean
        │       └── lastUpdate: timestamp
        ├── lasers/
        │   └── {laserId}/
        │       ├── id: string
        │       ├── playerId: string
        │       ├── origin: { x, y, z }
        │       ├── direction: { x, y, z }
        │       └── timestamp: number
        └── hits/
            └── {victimId}/
                ├── attackerId: string
                └── timestamp: number
```

### useMultiplayer.ts - Hook de Multijugador

#### Conexión
1. Generar ID único para el jugador
2. Buscar sala con espacio (max 10 jugadores)
3. Registrar jugador en Firebase
4. Configurar `onDisconnect` para limpieza automática

#### Sincronización
- **Posición**: Actualizada cada 50ms (20 updates/segundo)
- **Disparos**: Enviados inmediatamente al servidor
- **Hits**: Notificados vía Firebase, verificados localmente

#### Detección de Colisiones
```typescript
const HITBOX_RADIUS = 1.8  // Radio de hitbox

// Algoritmo:
// 1. Para cada láser propio activo
// 2. Para cada jugador enemigo no protegido
// 3. Calcular distancia punto-línea
// 4. Si distancia < HITBOX_RADIUS → HIT
// 5. Crear explosión y enviar hit a Firebase
```

### OtherShips.tsx - Naves Enemigas

Renderiza las naves de otros jugadores:
- Modelo GLTF low-poly (mismo que el jugador)
- Color único por jugador (10 colores disponibles)
- Rotación y posición sincronizadas
- Luces de motor cyan
- Indicador de nombre sobre la nave

### DeathScreen.tsx - Pantalla de Muerte

Cuando el jugador es eliminado:
1. Mostrar overlay con animación
2. Mostrar quién te eliminó
3. Respawn automático en 1.5 segundos
4. Nueva posición aleatoria

---

## Guía de Instalación y Desarrollo

### Requisitos
- Node.js 20.19+ o 22.12+
- npm o yarn

### Instalación
```bash
# Clonar repositorio
git clone <repo-url>
cd lab-portfolio

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Preview de producción
npm run preview
```

### Configuración de Firebase

El archivo `src/lib/firebase.ts` contiene la configuración:

```typescript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "portfolio-b43de.firebaseapp.com",
  databaseURL: "https://portfolio-b43de-default-rtdb.firebaseio.com",
  projectId: "portfolio-b43de",
  // ...
}
```

**Nota**: Para tu propia instancia, crea un proyecto en Firebase Console y reemplaza la configuración.

### Estructura de Modelos 3D

El modelo de nave está en `public/models/scene.gltf`:
- Formato: GLTF
- Tamaño: ~38KB (low-poly)
- Se usa tanto para la nave propia (3ª persona) como para otros jugadores

---

## Flujo de Navegación

```
                    ┌──────────────┐
                    │  ESPACIO     │
                    │  (OuterSpace)│
                    └──────┬───────┘
                           │
              Acercarse a planeta
                           │
                           ▼
                    ┌──────────────┐
                    │   WARNING    │
                    │ (nearbyPlanet)│
                    └──────┬───────┘
                           │
              Entrar (< 18 unidades)
                           │
                           ▼
                    ┌──────────────┐
                    │    WARP      │
                    │  (isWarping) │
                    └──────┬───────┘
                           │
              completeWarp()
                           │
                           ▼
                    ┌──────────────┐
                    │   SECCIÓN    │
                    │(currentSection)│
                    └──────┬───────┘
                           │
              goHome() / Botón Volver
                           │
                           ▼
                    ┌──────────────┐
                    │  ESPACIO     │
                    └──────────────┘
```

---

## Secciones del Portfolio

| ID | Nombre | Color | Geometría |
|----|--------|-------|-----------|
| about | Sobre Mí | #6366f1 (índigo) | octahedron |
| projects | Proyectos | #ec4899 (rosa) | dodecahedron |
| skills | Habilidades | #14b8a6 (teal) | torus |
| experience | Tecnologías | #f59e0b (ámbar) | box |
| contact | Contacto | #22c55e (verde) | sphere |

### Sección de Proyectos (ProjectsSection.tsx)

Tiene su propio sistema de "satélites" con proyectos:

| Proyecto | URL | Color |
|----------|-----|-------|
| XCalcGold | https://xcalcgold.com | #ffd700 (oro) |
| Portfolio 3D | null (actual) | #6366f1 |
| Próximamente | null | #4a4a4a |
| NUNCA | null (easter egg) | #1a1a1a |

**TunnelEffect**: Efecto de túnel al hacer click en un proyecto con URL
- Fuerza primera persona durante la animación
- Partículas moviéndose hacia la cámara
- Abre URL en nueva pestaña al completar

---

## Optimizaciones y Rendimiento

1. **Modelo low-poly**: Nave de ~38KB para carga rápida
2. **useGLTF.preload**: Precarga del modelo al iniciar
3. **Batching de actualizaciones**: Posición enviada cada 50ms, no cada frame
4. **Cleanup de recursos**: Listeners y suscripciones limpiados en unmount
5. **Additive blending**: Efectos visuales eficientes
6. **BufferGeometry**: Geometrías optimizadas para partículas

---

## Problemas Conocidos

1. **Vite version warning**: Requiere Node.js 20.19+ o 22.12+
2. **Chunk size warning**: Bundle > 500KB (normal para app 3D)
3. **WebGL context lost**: Se recarga automáticamente la página

---

## Créditos

- **Desarrollador**: Juan B.
- **Contacto**: devjpben@gmail.com
- **Tecnologías**: 123 Lotus, Office 97, Paint, Winamp (broma del portfolio)

---

*Documentación generada para Lab Portfolio v0.0.0*
*Última actualización: Febrero 2026*
