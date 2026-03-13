import { useState, useCallback } from 'react'
import { Badge, FigmaFrame } from './types'
import FigmaSetup from './components/FigmaSetup'
import Toolbar from './components/Toolbar'
import ImageCanvas from './components/ImageCanvas'
import DescriptionPanel from './components/DescriptionPanel'
import { exportAsHtml } from './exportHtml'
import './App.css'

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

export default function App() {
  const [frame, setFrame] = useState<FigmaFrame | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null)
  const [pendingBadge, setPendingBadge] = useState<{ label: string } | null>(null)
  const [exporting, setExporting] = useState(false)

  // 뱃지 추가 버튼 → 배치 대기 상태
  const handleAddBadge = useCallback((label: string) => {
    setPendingBadge({ label })
    setSelectedBadgeId(null)
  }, [])

  // 이미지 클릭 → 뱃지 배치
  const handleBadgePlace = useCallback((x: number, y: number) => {
    if (!pendingBadge) return
    const newBadge: Badge = {
      id: generateId(),
      label: pendingBadge.label,
      x,
      y,
      description: '',
    }
    setBadges(prev => [...prev, newBadge])
    setSelectedBadgeId(newBadge.id)
    setPendingBadge(null)
  }, [pendingBadge])

  // 뱃지 드래그 이동
  const handleBadgeMove = useCallback((id: string, x: number, y: number) => {
    setBadges(prev => prev.map(b => b.id === id ? { ...b, x, y } : b))
  }, [])

  // 설명 업데이트
  const handleUpdateDescription = useCallback((id: string, desc: string) => {
    setBadges(prev => prev.map(b => b.id === id ? { ...b, description: desc } : b))
  }, [])

  // 뱃지 삭제
  const handleDeleteBadge = useCallback((id: string) => {
    setBadges(prev => prev.filter(b => b.id !== id))
    setSelectedBadgeId(prev => prev === id ? null : prev)
  }, [])

  // 초기화 (Figma 설정 화면으로)
  const handleReset = useCallback(() => {
    if (!confirm('현재 작업을 모두 초기화하고 새 Figma 파일을 불러오시겠습니까?')) return
    setFrame(null)
    setBadges([])
    setSelectedBadgeId(null)
    setPendingBadge(null)
  }, [])

  // HTML 뷰어 내보내기
  const handleExport = useCallback(async () => {
    if (!frame || exporting) return
    setExporting(true)
    try {
      await exportAsHtml(frame, badges)
    } catch (e) {
      alert('내보내기 실패: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setExporting(false)
    }
  }, [frame, badges, exporting])

  if (!frame) {
    return <FigmaSetup onFrameLoaded={(f) => { setFrame(f); setBadges([]); setSelectedBadgeId(null) }} />
  }

  return (
    <div className="app">
      <Toolbar
        pendingLabel={pendingBadge?.label ?? null}
        badgeCount={badges.length}
        onAddBadge={handleAddBadge}
        onCancelPending={() => setPendingBadge(null)}
        onReset={handleReset}
        onExport={handleExport}
        exporting={exporting}
      />
      <div className="app-body">
        <ImageCanvas
          frame={frame}
          badges={badges}
          selectedBadgeId={selectedBadgeId}
          pendingBadge={pendingBadge}
          onBadgePlace={handleBadgePlace}
          onBadgeMove={handleBadgeMove}
          onBadgeSelect={setSelectedBadgeId}
        />
        <DescriptionPanel
          badges={badges}
          selectedBadgeId={selectedBadgeId}
          onSelectBadge={setSelectedBadgeId}
          onUpdateDescription={handleUpdateDescription}
          onDeleteBadge={handleDeleteBadge}
        />
      </div>
    </div>
  )
}
