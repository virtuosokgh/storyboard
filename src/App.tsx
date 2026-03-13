import { useState, useCallback } from 'react'
import { Badge, Screen, FigmaFrame } from './types'
import FigmaSetup from './components/FigmaSetup'
import Toolbar from './components/Toolbar'
import ImageCanvas from './components/ImageCanvas'
import DescriptionPanel from './components/DescriptionPanel'
import AddScreenModal from './components/AddScreenModal'
import { exportAsHtml } from './exportHtml'
import './App.css'

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

export default function App() {
  const [screens, setScreens] = useState<Screen[]>([])
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null)
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null)
  const [pendingBadge, setPendingBadge] = useState<{ label: string } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [exporting, setExporting] = useState(false)

  const activeScreen = screens.find(s => s.id === activeScreenId) ?? null
  const activeBadges = activeScreen?.badges ?? []
  const activeFrame = activeScreen?.frame ?? null

  // 화면 전환
  const handleSwitchScreen = useCallback((id: string) => {
    setActiveScreenId(id)
    setSelectedBadgeId(null)
    setPendingBadge(null)
  }, [])

  // 화면 추가 (모달에서)
  const handleAddScreen = useCallback((frame: FigmaFrame) => {
    const newScreen: Screen = { id: generateId(), frame, badges: [] }
    setScreens(prev => [...prev, newScreen])
    setActiveScreenId(newScreen.id)
    setSelectedBadgeId(null)
    setShowAddModal(false)
  }, [])

  // 화면 삭제
  const handleRemoveScreen = useCallback((id: string) => {
    setScreens(prev => {
      const next = prev.filter(s => s.id !== id)
      if (activeScreenId === id && next.length > 0) {
        setActiveScreenId(next[0].id)
        setSelectedBadgeId(null)
      }
      return next
    })
  }, [activeScreenId])

  // 뱃지 추가 → 배치 대기
  const handleAddBadge = useCallback((label: string) => {
    setPendingBadge({ label })
    setSelectedBadgeId(null)
  }, [])

  // 이미지 클릭 → 뱃지 배치
  const handleBadgePlace = useCallback((x: number, y: number) => {
    if (!pendingBadge || !activeScreenId) return
    const newBadge: Badge = {
      id: generateId(),
      label: pendingBadge.label,
      x,
      y,
      description: '',
    }
    setScreens(prev => prev.map(s =>
      s.id === activeScreenId ? { ...s, badges: [...s.badges, newBadge] } : s
    ))
    setSelectedBadgeId(newBadge.id)
    setPendingBadge(null)
  }, [pendingBadge, activeScreenId])

  // 뱃지 드래그 이동
  const handleBadgeMove = useCallback((id: string, x: number, y: number) => {
    if (!activeScreenId) return
    setScreens(prev => prev.map(s =>
      s.id === activeScreenId
        ? { ...s, badges: s.badges.map(b => b.id === id ? { ...b, x, y } : b) }
        : s
    ))
  }, [activeScreenId])

  // 설명 업데이트
  const handleUpdateDescription = useCallback((id: string, desc: string) => {
    if (!activeScreenId) return
    setScreens(prev => prev.map(s =>
      s.id === activeScreenId
        ? { ...s, badges: s.badges.map(b => b.id === id ? { ...b, description: desc } : b) }
        : s
    ))
  }, [activeScreenId])

  // 뱃지 삭제
  const handleDeleteBadge = useCallback((id: string) => {
    if (!activeScreenId) return
    setScreens(prev => prev.map(s =>
      s.id === activeScreenId
        ? { ...s, badges: s.badges.filter(b => b.id !== id) }
        : s
    ))
    setSelectedBadgeId(prev => prev === id ? null : prev)
  }, [activeScreenId])

  // 전체 초기화
  const handleReset = useCallback(() => {
    if (!confirm('모든 화면과 작업을 초기화하고 처음 화면으로 돌아가시겠습니까?')) return
    setScreens([])
    setActiveScreenId(null)
    setSelectedBadgeId(null)
    setPendingBadge(null)
  }, [])

  // HTML 뷰어 내보내기
  const handleExport = useCallback(async () => {
    if (screens.length === 0 || exporting) return
    setExporting(true)
    try {
      await exportAsHtml(screens)
    } catch (e) {
      alert('내보내기 실패: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setExporting(false)
    }
  }, [screens, exporting])

  // 첫 화면 설정
  if (screens.length === 0) {
    return (
      <FigmaSetup
        onFrameLoaded={(frame) => {
          const newScreen: Screen = { id: generateId(), frame, badges: [] }
          setScreens([newScreen])
          setActiveScreenId(newScreen.id)
        }}
      />
    )
  }

  return (
    <div className="app">
      <Toolbar
        pendingLabel={pendingBadge?.label ?? null}
        badgeCount={activeBadges.length}
        onAddBadge={handleAddBadge}
        onCancelPending={() => setPendingBadge(null)}
        onReset={handleReset}
        onExport={handleExport}
        exporting={exporting}
      />
      <div className="app-body">
        {activeFrame && (
          <ImageCanvas
            frame={activeFrame}
            badges={activeBadges}
            selectedBadgeId={selectedBadgeId}
            pendingBadge={pendingBadge}
            onBadgePlace={handleBadgePlace}
            onBadgeMove={handleBadgeMove}
            onBadgeSelect={setSelectedBadgeId}
          />
        )}
        <DescriptionPanel
          screens={screens}
          activeScreenId={activeScreenId}
          badges={activeBadges}
          selectedBadgeId={selectedBadgeId}
          onSelectBadge={setSelectedBadgeId}
          onUpdateDescription={handleUpdateDescription}
          onDeleteBadge={handleDeleteBadge}
          onSwitchScreen={handleSwitchScreen}
          onAddScreen={() => setShowAddModal(true)}
          onRemoveScreen={handleRemoveScreen}
        />
      </div>

      {showAddModal && (
        <AddScreenModal
          onAdd={handleAddScreen}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
