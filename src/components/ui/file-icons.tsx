interface IconProps {
  className?: string
}

export function ExcelIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="3" fill="#1D6F42" />
      <path d="M6 7h5l1.5 2.5L14 7h4l-4 5 4 5h-4l-1.5-2.5L11 17H6l4-5-4-5Z" fill="white" />
    </svg>
  )
}

export function PdfIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="3" fill="#E53935" />
      <text
        x="12" y="16"
        textAnchor="middle"
        fill="white"
        fontSize="7.5"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
        letterSpacing="0.5"
      >
        PDF
      </text>
    </svg>
  )
}
