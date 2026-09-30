import { motion, useAnimation } from 'framer-motion'
import { useState, useRef } from 'react'

/**
 * SpinWheel — a roulette-style wheel that randomly picks an item.
 * Props:
 *   items: Array<{ label: string, value: any, color?: string }>
 *   onSelect: (item) => void
 *   size?: number (px, default 220)
 */
export default function SpinWheel({ items, onSelect, size = 220 }) {
  const [spinning, setSpinning] = useState(false)
  const [selected, setSelected] = useState(null)
  const canvasRef = useRef(null)
  const rotationRef = useRef(0)

  const colors = [
    '#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6',
    '#0f172a', '#1e2d4a', '#0c2340', '#172554',
    '#1e40af', '#2d5a8e', '#0e3a6e', '#1a3a5c',
  ]

  const drawWheel = (rotation) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const cx = size / 2
    const cy = size / 2
    const r = size / 2 - 4
    const arc = (2 * Math.PI) / items.length

    ctx.clearRect(0, 0, size, size)

    items.forEach((item, i) => {
      const startAngle = rotation + i * arc
      const endAngle = startAngle + arc

      // Segment
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = item.color || colors[i % colors.length]
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Text
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(startAngle + arc / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${Math.max(9, size / 22)}px Inter, sans-serif`
      ctx.fillText(item.label, r - 8, 4)
      ctx.restore()
    })

    // Center circle
    ctx.beginPath()
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI)
    ctx.fillStyle = '#0a0e1a'
    ctx.fill()
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // Draw on mount & when items change
  useState(() => {
    requestAnimationFrame(() => drawWheel(rotationRef.current))
  })

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    setSelected(null)

    const totalSpins = 5 + Math.random() * 5
    const extraAngle = Math.random() * 2 * Math.PI
    const totalAngle = totalSpins * 2 * Math.PI + extraAngle
    const duration = 3000 + Math.random() * 1000
    const startTime = performance.now()
    const startRotation = rotationRef.current

    const ease = (t) => 1 - Math.pow(1 - t, 4)

    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const currentAngle = startRotation + totalAngle * ease(progress)
      rotationRef.current = currentAngle
      drawWheel(currentAngle)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Determine selected item
        const arc = (2 * Math.PI) / items.length
        // pointer is at top (3π/2 from 0, but we normalize)
        const normalized = (((-currentAngle - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
        const idx = Math.floor(normalized / arc) % items.length
        const winner = items[idx]
        setSelected(winner)
        setSpinning(false)
        onSelect?.(winner)
      }
    }

    requestAnimationFrame(animate)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Pointer */}
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-2 z-10 flex flex-col items-center"
          style={{ filter: 'drop-shadow(0 0 6px #3b82f6)' }}
        >
          <div className="w-3 h-5 bg-blue-400 clip-triangle" style={{
            clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
          }} />
        </div>
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-full cursor-pointer"
          style={{ filter: 'drop-shadow(0 0 16px rgba(59,130,246,0.4))' }}
          onClick={spin}
          onMouseEnter={() => drawWheel(rotationRef.current)}
        />
      </div>

      <motion.button
        onClick={spin}
        disabled={spinning}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.03 }}
        className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
          spinning
            ? 'bg-blue-900 text-blue-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500 text-white glow-blue'
        }`}
      >
        {spinning ? '⟳ Spinning...' : '🎡 Spin'}
      </motion.button>

      {selected && !spinning && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-blue-300 font-medium"
        >
          → <span className="text-white">{selected.label}</span>
        </motion.div>
      )}
    </div>
  )
}
