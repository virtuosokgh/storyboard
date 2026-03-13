import { useState } from 'react'
import './Toolbar.css'

interface Props {
  pendingLabel: string | null
  badgeCount: number
  onAddBadge: (label: string) => void
  onCancelPending: () => void
  onReset: () => void
  onExport: () => void
  exporting?: boolean
}

export default function Toolbar({
  pendingLabel,
  badgeCount,
  onAddBadge,
  onCancelPending,
  onReset,
  onExport,
  exporting = false,
}: Props) {
  const [input, setInput] = useState('')

  const handleAdd = () => {
    const label = input.trim() || String(badgeCount + 1)
    onAddBadge(label)
    setInput('')
  }

  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="7" fill="#7c6ef7"/>
          <path d="M8 10h6a4 4 0 010 8H8V10z" fill="white" opacity=".9"/>
          <circle cx="20" cy="22" r="4" fill="white" opacity=".7"/>
        </svg>
        <span>Storyboard</span>
      </div>

      <div className="toolbar-center">
        {pendingLabel ? (
          <div className="pending-notice">
            <span>
              <strong>"{pendingLabel}"</strong> 뱃지를 이미지에 클릭하여 배치하세요
            </span>
            <button className="btn-cancel" onClick={onCancelPending}>취소</button>
          </div>
        ) : (
          <div className="add-badge-group">
            <input
              type="text"
              className="badge-input"
              placeholder="뱃지 텍스트 (숫자 or 텍스트)..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              maxLength={6}
            />
            <button className="btn-add" onClick={handleAdd}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              뱃지 추가
            </button>
          </div>
        )}
      </div>

      <div className="toolbar-actions">
        <button className="btn-ghost" onClick={onExport} disabled={exporting} title="개발자용 HTML 뷰어 내보내기">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {exporting ? '내보내는 중...' : '공유 파일 내보내기'}
        </button>
        <button className="btn-ghost danger" onClick={onReset} title="초기화">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          초기화
        </button>
      </div>
    </header>
  )
}
