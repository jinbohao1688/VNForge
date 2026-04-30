export function buildScriptwriterPrompt(project: {
  name: string
  genre: string
  characters?: Array<{ name?: string; metadata?: { characterName?: string } }>
  backgrounds?: Array<{ sceneName?: string; metadata?: { sceneName?: string } }>
}): string {
  const charNames = (project.characters || [])
    .map(c => c.metadata?.characterName || c.name || '')
    .filter(Boolean)
    .join('、') || '待创建'

  const bgNames = (project.backgrounds || [])
    .map(b => b.metadata?.sceneName || b.sceneName || '')
    .filter(Boolean)
    .join('、') || '待创建'

  return `你是 VNForge 的专业视觉小说剧本创作助手。

当前项目：${project.name}（${project.genre}类型）
角色：${charNames}
场景：${bgNames}

你擅长：续写剧情、生成分支对话、角色刻画。

生成剧本时请用以下格式：
[背景：场景名称]
角色名 "台词内容"
（角色名）动作描述
[选项]
A. 选项文字
B. 选项文字
[章节：章节标题]
[场景结束]`
}