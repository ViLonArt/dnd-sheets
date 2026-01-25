import { Button } from '@/components/ui'

type TabKey = 'core' | 'spells' | 'inventory'

type CharacterTabsProps = {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

export function CharacterTabs({ activeTab, onTabChange }: CharacterTabsProps) {
  return (
    <div className="mt-3 flex gap-2">
      <Button
        onClick={() => onTabChange('core')}
        className={activeTab === 'core' ? 'bg-[#e6d3b4]' : ''}
      >
        Cœur & Combat
      </Button>
      <Button
        onClick={() => onTabChange('spells')}
        className={activeTab === 'spells' ? 'bg-[#e6d3b4]' : ''}
      >
        Sorts
      </Button>
      <Button
        onClick={() => onTabChange('inventory')}
        className={activeTab === 'inventory' ? 'bg-[#e6d3b4]' : ''}
      >
        Inventaire & Bio
      </Button>
    </div>
  )
}
