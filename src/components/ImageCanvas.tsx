import { useRef, useState, useCallback, useEffect } from 'react'
import { Badge, FigmaFrame } from '../types'
import './ImageCanvas.css'

interface Props {
  frame: FigmaFrame
  badges: Badge[]
  selectedBadgeId: string | null
  pendingBadge: { label: string } | null  // 배치 대기 중인 뱃지
  onBadgePlace: (x: number, y: number) => void
  onBadgeMove: (id: string, x: number, y: number) => void
  onBadgeSelect: (id: string | null) => void
}

export default function ImageCanvas({
  frame,
  badges,
  selectedBadgeId,
  pendingBadge,
  onBadgePlace,
  onBadgeMove,
  onBadgeSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragOffset = useRef({ dx: 0, dy: 0 })

  // 이미지 내의 실제 위치 계산
  const getImageRect = useCallback((): DOMRect | null => {
    return imgRef.current?.getBoundingClientRect() ?? null
  }, [])

  const clientToRatio = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const rect = getImageRect()
    if (!rect) return null
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    }
  }, [getImageRect])

  // 캔버스 클릭 → 뱃지 배치 (pendingBadge 있을 때)
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!pendingBadge) return
    const ratio = clientToRatio(e.clientX, e.clientY)
    if (!ratio) return
    onBadgePlace(ratio.x, ratio.y)
  }, [pendingBadge, clientToRatio, onBadgePlace])

  // 뱃지 드래그 시작
  const handleBadgeMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    onBadgeSelect(id)
    setDraggingId(id)

    const rect = getImageRect()
    if (!rect) return
    const badge = badges.find(b => b.id === id)
    if (!badge) return

    const badgeClientX = rect.left + badge.x * rect.width
    const badgeClientY = rect.top + badge.y * rect.height
    dragOffset.current = {
      dx: e.clientX - badgeClientX,
      dy: e.clientY - badgeClientY,
    }
  }, [badges, onBadgeSelect, getImageRect])

  useEffect(() => {
    if (!draggingId) return

    const handleMouseMove = (e: MouseEvent) => {
      const ratio = clientToRatio(
        e.clientX - dragOffset.current.dx,
        e.clientY - dragOffset.current.dy
      )
      if (ratio) onBadgeMove(draggingId, ratio.x, ratio.y)
    }
    const handleMouseUp = () => setDraggingId(null)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingId, clientToRatio, onBadgeMove])

  return (
    <div
      className={`canvas-container ${pendingBadge ? 'placing' : ''}`}
      ref={containerRef}
    >
      {/* 이미지 영역 */}
      <div
        className="canvas-image-wrap"
        onClick={handleCanvasClick}
      >
        {!imgLoaded && (
          <div className="canvas-loading">
            <div className="spinner" />
            <span>이미지 불러오는 중...</span>
          </div>
        )}
        <img
          ref={imgRef}
          src={frame.imageUrl}
          alt={frame.name}
          className={`canvas-image ${imgLoaded ? 'visible' : ''}`}
          onLoad={() => setImgLoaded(true)}
          draggable={false}
        />

        {/* 뱃지 오버레이 */}
        {imgLoaded && badges.map(badge => (
          <BadgePin
            key={badge.id}
            badge={badge}
            isSelected={badge.id === selectedBadgeId}
            isDragging={badge.id === draggingId}
            onMouseDown={(e) => handleBadgeMouseDown(e, badge.id)}
            onClick={(e) => { e.stopPropagation(); onBadgeSelect(badge.id) }}
          />
        ))}

        {/* 배치 모드 힌트 */}
        {pendingBadge && imgLoaded && (
          <div className="placing-hint">
            클릭하여 <strong>"{pendingBadge.label}"</strong> 뱃지를 배치하세요
          </div>
        )}
      </div>

      {/* 하단 Figma 링크 */}
      <div className="canvas-footer">
        <span className="frame-name-label">{frame.name}</span>
        <a
          href={frame.figmaUrl}
          target="_blank"
          rel="noreferrer"
          className="figma-link"
          onClick={e => e.stopPropagation()}
        >
          <FigmaIcon />
          Figma에서 디자인 스펙 확인 ↗
        </a>
      </div>
    </div>
  )
}

function BadgePin({
  badge,
  isSelected,
  isDragging,
  onMouseDown,
  onClick,
}: {
  badge: Badge
  isSelected: boolean
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <div
      className={`badge-pin ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{ left: `${badge.x * 100}%`, top: `${badge.y * 100}%` }}
      onMouseDown={onMouseDown}
      onClick={onClick}
      title={badge.description || badge.label}
    >
      <span>{badge.label}</span>
    </div>
  )
}

function FigmaIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 38 57" fill="none">
      <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1ABCFE"/>
      <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 0 1-19 0z" fill="#0ACF83"/>
      <path d="M19 0v19h9.5a9.5 9.5 0 0 0 0-19H19z" fill="#FF7262"/>
      <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#F24E1E"/>
      <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#A259FF"/>
    </svg>
  )
}
