/**
 * Figma URL 파싱 유틸
 *
 * 지원 형식:
 *   https://www.figma.com/file/{fileKey}/...?node-id={nodeId}
 *   https://www.figma.com/design/{fileKey}/...?node-id={nodeId}
 */
export function parseFigmaUrl(url: string): { fileKey: string; nodeId: string | null } | null {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/')
    // /file/{key}/... or /design/{key}/...
    const typeIdx = parts.findIndex(p => p === 'file' || p === 'design')
    if (typeIdx === -1 || !parts[typeIdx + 1]) return null
    const fileKey = parts[typeIdx + 1]
    const rawNodeId = u.searchParams.get('node-id')
    // node-id는 "1234-5678" 형태 → API는 "1234:5678" 형태 필요
    const nodeId = rawNodeId ? rawNodeId.replace('-', ':') : null
    return { fileKey, nodeId }
  } catch {
    return null
  }
}

/**
 * Figma REST API 직접 호출 (CORS 지원, 별도 서버 불필요)
 */
async function figmaFetch(path: string, token: string) {
  const res = await fetch(`https://api.figma.com${path}`, {
    headers: { 'X-Figma-Token': token }
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || `Figma API error: ${res.status}`)
  }
  return res.json()
}

export interface FigmaNodeMeta {
  id: string
  name: string
  width: number
  height: number
}

/**
 * 파일의 특정 노드(or 루트) 정보 가져오기
 */
export async function fetchFigmaNodeMeta(
  fileKey: string,
  nodeId: string | null,
  token: string
): Promise<FigmaNodeMeta[]> {
  if (nodeId) {
    const data = await figmaFetch(`/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`, token)
    const node = data.nodes?.[nodeId]?.document
    if (!node) throw new Error('노드를 찾을 수 없습니다.')
    const bbox = node.absoluteBoundingBox || node.size || { width: 0, height: 0 }
    return [{ id: node.id, name: node.name, width: bbox.width, height: bbox.height }]
  } else {
    // 루트의 첫 번째 페이지 children 가져오기
    const data = await figmaFetch(`/v1/files/${fileKey}?depth=2`, token)
    const pages: FigmaNodeMeta[] = []
    for (const child of (data.document?.children ?? [])) {
      for (const frame of (child.children ?? [])) {
        if (frame.type === 'FRAME' || frame.type === 'COMPONENT') {
          const bbox = frame.absoluteBoundingBox || frame.size || { width: 0, height: 0 }
          pages.push({ id: frame.id, name: frame.name, width: bbox.width, height: bbox.height })
        }
      }
    }
    return pages.slice(0, 20)
  }
}

/**
 * 노드 이미지 URL 가져오기 (PNG export)
 */
export async function fetchFigmaImageUrl(
  fileKey: string,
  nodeId: string,
  token: string
): Promise<string> {
  const data = await figmaFetch(
    `/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=2`,
    token
  )
  const url = data.images?.[nodeId]
  if (!url) throw new Error('이미지를 내보낼 수 없습니다.')
  return url
}
