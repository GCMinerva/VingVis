"use client"

import { useEffect, useRef } from "react"

const codeSnippets = [
  "motorFL.setPower(0.8);",
  "motorFR.setPower(0.8);",
  "sleep(1000);",
  "if (opModeIsActive()) {",
  "telemetry.addData(\"Status\", \"Running\");",
  "double power = 0.5;",
  "robot.drive(FORWARD, 12);",
  "robot.turn(LEFT, 90);",
  "waitForStart();",
  "hardware.init();",
  "@Autonomous",
  "public void runOpMode() {",
  "DcMotor frontLeft;",
  "Servo claw;",
  "IMU imu = hardwareMap.get(IMU.class);",
  "while (opModeIsActive()) {",
  "telemetry.update();",
  "double heading = imu.getRobotYawPitchRollAngles();",
  "// Move forward",
  "// Turn robot",
  "vision.detectAprilTag();",
]

export function CodeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    // Code particles
    class CodeParticle {
      x: number
      y: number
      text: string
      speed: number
      opacity: number
      fontSize: number

      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.text = codeSnippets[Math.floor(Math.random() * codeSnippets.length)]
        this.speed = 0.2 + Math.random() * 0.5
        this.opacity = 0.1 + Math.random() * 0.3
        this.fontSize = 12 + Math.random() * 4
      }

      update() {
        this.y += this.speed
        if (this.y > canvas.height + 50) {
          this.y = -50
          this.x = Math.random() * canvas.width
          this.text = codeSnippets[Math.floor(Math.random() * codeSnippets.length)]
        }
      }

      draw() {
        if (!ctx) return
        ctx.font = `${this.fontSize}px 'Courier New', monospace`
        ctx.fillStyle = `rgba(147, 197, 253, ${this.opacity})` // blue-300 with variable opacity
        ctx.fillText(this.text, this.x, this.y)
      }
    }

    // Create particles
    const particles: CodeParticle[] = []
    const particleCount = 30
    for (let i = 0; i < particleCount; i++) {
      particles.push(new CodeParticle())
    }

    // Animation loop
    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw grid pattern
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.05)'
      ctx.lineWidth = 1
      const gridSize = 50
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Update and draw particles
      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
