import { GuideButton, RendererItem } from '../lib/protobuf/response/guide_pb'

export function restoreSubscriptionsTab (items: RendererItem[]): boolean {
  const hasIdentifier = (item: RendererItem, id: string): boolean =>
    item.iconRender?.browseId === id || item.labelRender?.browseId === id

  if (items.some(item => hasIdentifier(item, 'FEsubscriptions'))) return false
  const home = items.find(item => hasIdentifier(item, 'FEwhat_to_watch'))
  if (!home) return false

  try {
    const homeButton = GuideButton.fromBinary(home.toBinary())
    // 不猜测未知布局，避免向 Music 或无法识别的导航栏插入按钮。
    if (Boolean(homeButton.iconRender) === Boolean(homeButton.labelRender)) return false
    const homeRenderer = homeButton.iconRender ?? homeButton.labelRender
    if (homeRenderer?.navigationEndpoint?.browseEndpoint?.browseId !== 'FEwhat_to_watch' ||
        !homeRenderer.icon?.iconType) return false

    const entry = {
      pivotIdentifier: 'FEsubscriptions',
      navigationEndpoint: { browseEndpoint: { browseId: 'FEsubscriptions' } },
      // 跟随首页的 Cairo 图标风格，否则使用普通订阅图标。
      icon: { iconType: homeRenderer.icon.iconType === 1154 ? 1155 : 408 },
      navigationType: 1
    }
    const button = new GuideButton(homeButton.iconRender
      ? { iconRender: { ...entry, accessibility: { data: { label: '订阅' } } } }
      : { labelRender: { ...entry, title: { runs: [{ text: '订阅' }] } } })

    // 转回原有类型，让标题、跳转和图标与其他未知字段一起原样写出。
    const item = RendererItem.fromBinary(button.toBinary())
    const libraryIndex = items.findIndex(item => hasIdentifier(item, 'FElibrary'))
    items.splice(libraryIndex < 0 ? items.length : libraryIndex, 0, item)
    return true
  } catch {
    // 新版本字段不兼容时保留原导航，不影响现有去广告和按钮过滤。
    return false
  }
}
