import { useState, useEffect } from 'react'
import { Badge } from '../types'
import './DescriptionPanel.css'

interface Props {
  badges: Badge[]
  selectedBadgeId: string | null
  onSelectBadge: (id: string | null) => void
  onUpdateDescription: (id: string, desc: string) => void
  onDeleteBadge: (id: string) => void
}

export default function DescriptionPanel({
  badges,
  selectedBadgeId,
  onSelectBadge,
  onUpdateDescription,
  onDeleteBadge,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftDesc, setDraftDesc] = useState('')

  const selectedBadge = badges.find(b => b.id === selectedBadgeId) ?? null

  // 선택된 뱃지가 바뀔 때만 편집 상태 초기화 (badges 변경 시 재실행 방지)
  useEffect(() => {
    if (selectedBadgeId) {
      const badge = badges.find(b => b.id === selectedBadgeId)
      if (badge) {
        setEditingId(badge.id)
        setDraftDesc(badge.description)
      }
    } else {
      setEditingId(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBadgeId])

  const handleSave = (id: string) => {
    onUpdateDescription(id, draftDesc)
    setEditingId(null)
  }

  return (
    <aside className="desc-panel">
      <div className="panel-header">
        <h2>주석</h2>
        <span className="badge-count">{badges.length}</span>
      </div>

      {badges.length === 0 ? (
        <div className="panel-empty">
          <div className="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2"/>
              <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p>이미지 위에 뱃지를 배치하면<br/>여기서 설명을 입력할 수 있습니다.</p>
        </div>
      ) : (
        <div className="badge-list">
          {badges.map((badge, idx) => (
            <div
              key={badge.id}
              className={`badge-entry ${badge.id === selectedBadgeId ? 'active' : ''}`}
              onClick={() => onSelectBadge(badge.id)}
            >
              <div className="entry-header">
                <div className="entry-pin">
                  <span>{badge.label}</span>
                </div>
                <div className="entry-actions">
                  <span className="entry-index">#{idx + 1}</span>
                  <button
                    className="delete-btn"
                    onClick={e => { e.stopPropagation(); onDeleteBadge(badge.id) }}
                    title="뱃지 삭제"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              {editingId === badge.id ? (
                <div className="entry-edit" onClick={e => e.stopPropagation()}>
                  <textarea
                    value={draftDesc}
                    onChange={e => setDraftDesc(e.target.value)}
                    placeholder="이 뱃지에 대한 설명을 입력하세요..."
                    autoFocus
                    rows={4}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave(badge.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                  <div className="edit-actions">
                    <span className="edit-hint">⌘↵ 저장 · Esc 취소</span>
                    <button className="save-btn" onClick={() => handleSave(badge.id)}>저장</button>
                  </div>
                </div>
              ) : (
                <div
                  className={`entry-desc ${!badge.description ? 'placeholder' : ''}`}
                  onClick={e => {
                    e.stopPropagation()
                    setEditingId(badge.id)
                    setDraftDesc(badge.description)
                    onSelectBadge(badge.id)
                  }}
                >
                  {badge.description || '클릭하여 설명 추가...'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedBadge && (
        <div className="panel-selected-info">
          <span>선택됨: <strong>{selectedBadge.label}</strong></span>
        </div>
      )}
    </aside>
  )
}
