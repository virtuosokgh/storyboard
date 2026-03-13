import { useState } from 'react'
import { parseFigmaUrl, fetchFigmaNodeMeta, fetchFigmaImageUrl, FigmaNodeMeta } from '../figmaUtils'
import { FigmaFrame } from '../types'
import './AddScreenModal.css'

interface Props {
  onAdd: (frame: FigmaFrame) => void
  onClose: () => void
}

export default function AddScreenModal({ onAdd, onClose }: Props) {
  const token = localStorage.getItem('figma_token') || ''
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [frames, setFrames] = useState<FigmaNodeMeta[]>([])
  const [parsedKey, setParsedKey] = useState('')

  const handleFetch = async () => {
    if (!url.trim()) { setError('Figma URL을 입력해주세요.'); return }
    if (!token) { setError('저장된 토큰이 없습니다. 초기화 후 다시 설정해주세요.'); return }

    setError('')
    setLoading(true)
    setFrames([])

    try {
      const parsed = parseFigmaUrl(url.trim())
      if (!parsed) throw new Error('올바른 Figma URL 형식이 아닙니다.')

      setParsedKey(parsed.fileKey)

      if (parsed.nodeId) {
        const metas = await fetchFigmaNodeMeta(parsed.fileKey, parsed.nodeId, token)
        const meta = metas[0]
        const imageUrl = await fetchFigmaImageUrl(parsed.fileKey, meta.id, token)
        onAdd({ id: meta.id, name: meta.name, imageUrl, figmaUrl: url.trim(), width: meta.width, height: meta.height })
      } else {
        const list = await fetchFigmaNodeMeta(parsed.fileKey, null, token)
        if (list.length === 0) throw new Error('파일에 프레임이 없습니다.')
        setFrames(list)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectFrame = async (meta: FigmaNodeMeta) => {
    setLoading(true)
    setError('')
    try {
      const imageUrl = await fetchFigmaImageUrl(parsedKey, meta.id, token)
      const nodeUrl = `https://www.figma.com/file/${parsedKey}?node-id=${meta.id.replace(':', '-')}`
      onAdd({ id: meta.id, name: meta.name, imageUrl, figmaUrl: nodeUrl, width: meta.width, height: meta.height })
    } catch (e) {
      setError(e instanceof Error ? e.message : '이미지를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="3" width="20" height="14" rx="2" stroke="var(--accent)" strokeWidth="2"/>
              <path d="M8 21h8M12 17v4" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h2>화면 추가</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="setup-field">
            <label>Figma URL</label>
            <input
              type="text"
              placeholder="https://www.figma.com/file/... or /design/..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFetch()}
              autoFocus
            />
            <span className="field-hint">특정 프레임 URL이면 바로 로드됩니다. 파일 URL이면 프레임을 선택합니다.</span>
          </div>

          {error && <div className="setup-error">{error}</div>}

          <button className="btn-primary" onClick={handleFetch} disabled={loading}>
            {loading ? '불러오는 중...' : '프레임 불러오기'}
          </button>

          {frames.length > 0 && (
            <div className="frame-list">
              <p className="frame-list-title">프레임을 선택하세요</p>
              {frames.map(f => (
                <button
                  key={f.id}
                  className="frame-item"
                  onClick={() => handleSelectFrame(f)}
                  disabled={loading}
                >
                  <span className="frame-name">{f.name}</span>
                  <span className="frame-size">{Math.round(f.width)} × {Math.round(f.height)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
