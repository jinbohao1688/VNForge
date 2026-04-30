export interface AICharacter {
  name: string
  personality: string
  routeTheme?: string
  description?: string
  endings: ('HE' | 'BE')[]
}

export interface AIChapter {
  id: string
  title: string
  summary: string
  keyChoices: number
}

export interface AIPlan {
  title: string
  genre: string
  worldSetting: string
  protagonist: { name: string; description: string }
  heroines: AICharacter[]
  chapterOutline: AIChapter[]
  requiredAssets: {
    backgrounds: string[]
    characters: string[]
  }
  estimatedWords: number
}

