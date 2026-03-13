export interface Badge {
  id: string
  label: string       // 배지에 표시되는 텍스트/숫자
  x: number           // 이미지 기준 비율 (0~1)
  y: number
  description: string
}

export interface FigmaFrame {
  id: string
  name: string
  imageUrl: string    // Figma export image URL
  figmaUrl: string    // 원본 Figma 링크
  width: number
  height: number
}

export interface StoryboardPage {
  id: string
  frame: FigmaFrame
  badges: Badge[]
}
