import { useState } from 'react'
import { parseFigmaUrl, fetchFigmaNodeMeta, fetchFigmaImageUrl, FigmaNodeMeta } from '../figmaUtils'
import { FigmaFrame } from '../types'
import './FigmaSetup.css'

interface Props {
  onFrameLoaded: (frame: FigmaFrame) => void
}

export default function FigmaSetup({ onFrameLoaded }: Props) {
  const [token, setToken] = useState(() => localStorage.getItem('figma_token') || '')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [frames, setFrames] = useState<FigmaNodeMeta[]>([])
  const [parsedKey, setParsedKey] = useState('')

  const handleFetch = async () => {
    if (!token.trim()) { setError('Figma Personal Access Token을 입력해주세요.'); return }
    if (!url.trim()) { setError('Figma URL을 입력해주세요.'); return }

    setError('')
    setLoading(true)
    setFrames([])

    try {
      localStorage.setItem('figma_token', token.trim())
      const parsed = parseFigmaUrl(url.trim())
      if (!parsed) throw new Error('올바른 Figma URL 형식이 아닙니다.')

      setParsedKey(parsed.fileKey)

      if (parsed.nodeId) {
        // 특정 노드 → 바로 이미지 로드
        const metas = await fetchFigmaNodeMeta(parsed.fileKey, parsed.nodeId, token.trim())
        const meta = metas[0]
        const imageUrl = await fetchFigmaImageUrl(parsed.fileKey, meta.id, token.trim())
        onFrameLoaded({
          id: meta.id,
          name: meta.name,
          imageUrl,
          figmaUrl: url.trim(),
          width: meta.width,
          height: meta.height,
        })
      } else {
        // 파일 루트 → 프레임 목록 표시
        const list = await fetchFigmaNodeMeta(parsed.fileKey, null, token.trim())
        if (list.length === 0) throw new Error('파일에 프레임이 없습니다.')
        setFrames(list)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectFrame = async (meta: FigmaNodeMeta) => {
    setLoading(true)
    setError('')
    try {
      const imageUrl = await fetchFigmaImageUrl(parsedKey, meta.id, token.trim())
      const nodeUrl = `https://www.figma.com/file/${parsedKey}?node-id=${meta.id.replace(':', '-')}`
      onFrameLoaded({
        id: meta.id,
        name: meta.name,
        imageUrl,
        figmaUrl: nodeUrl,
        width: meta.width,
        height: meta.height,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '이미지를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="setup-overlay">
      <div className="setup-card">
        <div className="setup-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#7c6ef7"/>
            <path d="M8 10h6a4 4 0 010 8H8V10z" fill="white" opacity=".9"/>
            <circle cx="20" cy="22" r="4" fill="white" opacity=".7"/>
          </svg>
          <span>Storyboard</span>
        </div>

        <h1>Figma 디자인 연결</h1>
        <p className="setup-desc">
          Figma Personal Access Token과 파일/프레임 URL을 입력하면<br/>
          이미지를 가져와 뱃지 주석을 달 수 있습니다.
        </p>

        <div className="setup-field">
          <label>
            Personal Access Token
            <a href="https://www.figma.com/developers/api#access-tokens" target="_blank" rel="noreferrer" className="help-link">
              발급 방법 ↗
            </a>
          </label>
          <input
            type="password"
            placeholder="figd_xxxxxxxxxxxx..."
            value={token}
            onChange={e => setToken(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="setup-field">
          <label>Figma URL</label>
          <input
            type="text"
            placeholder="https://www.figma.com/file/... or /design/..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFetch()}
          />
          <span className="field-hint">특정 프레임 URL이면 바로 로드됩니다. 파일 URL이면 프레임을 선택합니다.</span>
        </div>

        {error && <div className="setup-error">{error}</div>}

        <button
          className="btn-primary"
          onClick={handleFetch}
          disabled={loading}
        >
          {loading ? '불러오는 중...' : '디자인 불러오기'}
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
  )
}
