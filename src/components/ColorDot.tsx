interface ColorDotProps {
  color: string
  size?: number
}

export default function ColorDot({ color, size = 30 }: ColorDotProps) {
  return (
    <span
      className="inline-block rounded-full border border-white/20"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
      title={color}
    />
  )
}
