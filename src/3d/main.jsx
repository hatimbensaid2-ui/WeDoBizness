/*
 * WeDoBizness 3D layer, built into /assets/vendor/wdb-3d.js
 *
 *  - WDB3D.mountHero(el):  animated ShaderGradient behind the homepage hero
 *  - WDB3D.mountMarks(el): React Three Fiber scene with the extruded growth-arrow mark
 *
 * Rebuild after edits:  cd src/3d && npm install && npm run build
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react'

const BRAND = {
  orange: '#FF461F',
  cream: '#F4EEE6',
  sand: '#E3DAD0',
  peach: '#FFC7B0',
  cocoa: '#5A2814',
  brown: '#270F04',
}

/* Pause rendering whenever the element is off screen (saves battery and GPU). */
function useOnScreen(el, rootMargin = '120px') {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [el, rootMargin])
  return visible
}

/* Lives inside any R3F canvas and switches its render loop on and off. */
function Frameloop({ active }) {
  const setFrameloop = useThree((s) => s.setFrameloop)
  useEffect(() => { setFrameloop(active ? 'always' : 'never') }, [active, setFrameloop])
  return null
}

/* ------------------------------------------------------------------ *
 * Hero: ShaderGradient (built on React Three Fiber)
 * ------------------------------------------------------------------ */
function HeroGradient({ host, onReady }) {
  const visible = useOnScreen(host)
  useEffect(() => {
    const t = setTimeout(onReady, 350) // let the first frames draw before fading in
    return () => clearTimeout(t)
  }, [onReady])
  return (
    <ShaderGradientCanvas
      style={{ position: 'absolute', inset: 0 }}
      pixelDensity={Math.min(window.devicePixelRatio || 1, 1.25)}
      fov={45}
      pointerEvents="none"
      powerPreference="low-power"
    >
      <Frameloop active={visible} />
      <ShaderGradient
        control="props"
        type="waterPlane"
        animate="on"
        uSpeed={0.14}
        uStrength={1.6}
        uDensity={1.1}
        uFrequency={5.5}
        uAmplitude={1}
        positionX={0}
        positionY={0.6}
        positionZ={0}
        rotationX={50}
        rotationY={0}
        rotationZ={-60}
        color1={BRAND.orange}
        color2={BRAND.cream}
        color3={BRAND.peach}
        reflection={0.1}
        brightness={1.1}
        lightType="3d"
        grain="off"
        cAzimuthAngle={180}
        cPolarAngle={80}
        cDistance={2.8}
        cameraZoom={9.1}
        enableTransition={false}
      />
    </ShaderGradientCanvas>
  )
}

/* ------------------------------------------------------------------ *
 * Steroid band: extruded growth-arrow mark in React Three Fiber
 * ------------------------------------------------------------------ */
// Same outline as /assets/mark.svg (120x120 viewBox)
const MARK_POINTS = [
  [11, 49], [22, 49], [40, 77], [56, 49], [67, 49], [83, 77], [105, 30], [115, 19],
  [119, 49], [111, 43], [87, 94], [74, 94], [61, 74], [48, 94], [35, 94],
]

function useMarkGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape()
    MARK_POINTS.forEach(([x, y], i) => {
      const px = (x - 65) / 40
      const py = -(y - 56) / 40 // SVG y points down
      i ? shape.lineTo(px, py) : shape.moveTo(px, py)
    })
    shape.closePath()
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.32,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.04,
      bevelSegments: 4,
    })
    geo.center()
    return geo
  }, [])
}

function Mark({ geometry, color, position, scale, speed, phase, pointer }) {
  const ref = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + phase
    const m = ref.current
    if (!m) return
    m.position.y = position[1] + Math.sin(t) * 0.18
    m.rotation.y = Math.sin(t * 0.7) * 0.55 + pointer.current.x * 0.45
    m.rotation.x = 0.2 + Math.cos(t * 0.5) * 0.12 - pointer.current.y * 0.3
    m.rotation.z = Math.sin(t * 0.4) * 0.06
  })
  return (
    <mesh ref={ref} geometry={geometry} position={position} scale={scale} castShadow>
      <meshStandardMaterial color={color} roughness={0.32} metalness={0.15} />
    </mesh>
  )
}

function MarkScene({ host }) {
  const visible = useOnScreen(host)
  const geometry = useMarkGeometry()
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e) => {
      const r = host.getBoundingClientRect()
      pointer.current.x = ((e.clientX - r.left) / r.width - 0.5) * 2
      pointer.current.y = ((e.clientY - r.top) / r.height - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [host])

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 9], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <Frameloop active={visible} />
      <ambientLight intensity={1.6} />
      <directionalLight position={[4, 6, 8]} intensity={2.4} />
      <directionalLight position={[-6, -2, 4]} intensity={0.8} color={BRAND.cream} />
      <Marks geometry={geometry} pointer={pointer} />
    </Canvas>
  )
}

/* Keep the marks pinned near the band edges, clear of the centered copy. */
function Marks({ geometry, pointer }) {
  const half = useThree((s) => s.viewport.width / 2)
  const x = Math.max(half - 2.7, 3.2)
  return (
    <>
      <Mark geometry={geometry} color={BRAND.cocoa} position={[x, 0.1, 0]} scale={1.15} speed={0.9} phase={0} pointer={pointer} />
      <Mark geometry={geometry} color={BRAND.cream} position={[-x + 0.2, -0.4, -1]} scale={0.85} speed={0.75} phase={2.1} pointer={pointer} />
    </>
  )
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */
function mount(el, node) {
  if (!el) return null
  const root = createRoot(el)
  root.render(node)
  return () => root.unmount()
}

window.WDB3D = {
  mountHero(el) {
    return mount(el, <HeroGradient host={el} onReady={() => el.classList.add('is-ready')} />)
  },
  mountMarks(el) {
    const unmount = mount(el, <MarkScene host={el} />)
    requestAnimationFrame(() => el.classList.add('is-ready'))
    return unmount
  },
}
