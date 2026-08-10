import { useEffect, useId, useRef } from "react"
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react"

import { metalClickSound } from "../lib/metal-click"
import { useSound } from "../hooks/use-sound"

export function SpotlightLogo({ onClick }: { onClick?: () => void }) {
  const id = useId()
  const ids = {
    stroke: `spotlight-logo-stroke-${id}`,
    radialGradient: `spotlight-logo-radial-gradient-${id}`,
  }

  const ref = useRef<SVGSVGElement>(null)

  const [play] = useSound(metalClickSound)

  const shouldReduceMotion = useReducedMotion()
  const isInView = useInView(ref, { margin: "80px" })

  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const cx = useSpring(useTransform(mouseX, [0, 1], [0, 512]), {
    stiffness: 300,
    damping: 30,
    mass: 0.1,
  })

  const cy = useSpring(useTransform(mouseY, [0, 1], [0, 512]), {
    stiffness: 300,
    damping: 30,
    mass: 0.1,
  })

  useEffect(() => {
    if (shouldReduceMotion || !isInView) {
      return
    }

    if (window.matchMedia("(hover: none)").matches) {
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      // Compute relative cursor coordinates [0, 1] within the SVG box itself
      mouseX.set((e.clientX - rect.left) / rect.width)
      mouseY.set((e.clientY - rect.top) / rect.height)
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [shouldReduceMotion, isInView, mouseX, mouseY])

  return (
    <motion.svg
      ref={ref}
      className="mx-auto w-full max-w-[280px] aspect-square cursor-pointer touch-manipulation [--stroke:color-mix(in_oklab,var(--c-text-primary)_12%,var(--c-background))]"
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onTap={() => {
        play()
        onClick?.()
      }}
    >
      <defs>
        <motion.path
          id={ids.stroke}
          d="M 72 256 C 128 60 192 60 256 256 S 384 452 440 256"
          strokeWidth="44"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        <motion.radialGradient
          id={ids.radialGradient}
          cx={cx}
          cy={cy}
          r="160"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            stopColor="var(--c-accent-from, #679cff)"
          />
          <stop
            offset="1"
            stopColor="var(--c-accent-to, #007aff)"
            stopOpacity="0"
          />
        </motion.radialGradient>
      </defs>

      {/* Render the base subtle outline */}
      <use href={`#${ids.stroke}`} stroke="var(--stroke)" strokeWidth="44" strokeLinecap="round" strokeLinejoin="round" />
      {/* Layer the cursor-tracking gradient highlight */}
      <use href={`#${ids.stroke}`} stroke={`url(#${ids.radialGradient})`} strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  )
}
