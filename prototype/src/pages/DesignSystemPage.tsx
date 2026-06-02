import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Toggle } from '../components/ui/Toggle'
import { Card } from '../components/ui/Card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { EmptyState } from '../components/ui/EmptyState'
import { Banner } from '../components/ui/Banner'
import { SettingsRow } from '../components/ui/SettingsRow'
import { Mic } from 'lucide-react'

export function DesignSystemPage() {
  const [t1, setT1] = useState(false)
  const [t2, setT2] = useState(true)

  return (
    <div className="flex flex-col gap-10 pb-10">
      <div>
        <h1 className="text-[23.6px] font-[500] text-neutral-900 font-serif">Design System</h1>
        <p className="text-[13px] text-neutral-500 mt-1">Cartesia component library</p>
      </div>

      <section className="flex flex-col gap-3">
        <p className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wider">Buttons</p>
        <div className="flex flex-wrap gap-2 items-center">
          <Button>+ Create voice agent</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wider">Badges</p>
        <div className="flex items-center gap-4">
          <Badge variant="beta">Beta</Badge>
          <div className="flex items-center gap-1.5 text-[13px] text-neutral-700"><Badge variant="status" color="green" /> Active</div>
          <div className="flex items-center gap-1.5 text-[13px] text-neutral-500"><Badge variant="status" color="gray" /> Inactive</div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wider">Inputs</p>
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <Input label="Regular label" placeholder="Enter value..." />
          <Input label="voice_id" paramStyle required placeholder="Select a voice..." />
          <Input label="name" paramStyle required charCount={{ current: 0, max: 64 }} />
          <Input label="With error" placeholder="Enter value..." error="This field is required" />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wider">Selects</p>
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <Select label="language" paramStyle required>
            <option value="">Select language</option>
            <option>English</option>
          </Select>
          <Select label="Voice">
            <option>Skylar - Friendly Guide</option>
          </Select>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wider">Toggles</p>
        <div className="flex flex-col gap-4 max-w-md">
          <Toggle checked={t1} onChange={setT1} label="Language detection" badge="Beta" description="Auto-detect the caller's language." />
          <Toggle checked={t2} onChange={setT2} label="Enable avatar" />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wider">Banners</p>
        <Banner variant="warning">Please upgrade to invite more members.</Banner>
        <Banner variant="info">Avatar feature is in beta.</Banner>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wider">Cards</p>
        <div className="grid grid-cols-3 gap-3 max-w-2xl">
          <Card><p className="text-[13px] font-[500]">Default</p></Card>
          <Card selectable selected><p className="text-[13px] font-[500]">Selected</p></Card>
          <Card selectable><p className="text-[13px] font-[500]">Unselected</p></Card>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wider">Tabs + Settings rows</p>
        <Tabs defaultValue="config">
          <TabsList>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="avatar">Avatar</TabsTrigger>
          </TabsList>
          <TabsContent value="config" className="pt-2">
            <SettingsRow label="Voice" description="Choose a Cartesia voice.">
              <Select><option>Skylar - Friendly Guide</option></Select>
            </SettingsRow>
            <SettingsRow label="Language detection" description="Auto-detect the caller's language.">
              <Toggle checked={t1} onChange={setT1} label="Enable" badge="Beta" />
            </SettingsRow>
          </TabsContent>
          <TabsContent value="avatar" className="pt-6">
            <p className="text-[13px] text-neutral-500">Avatar tab goes here.</p>
          </TabsContent>
        </Tabs>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wider">Breadcrumb</p>
        <Breadcrumb items={[{ label: 'All agents', href: '#' }, { label: 'Create new agent', href: '#' }, { label: 'Template' }]} />
      </section>

      <section className="flex flex-col gap-3 pb-10">
        <p className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wider">Empty state</p>
        <div className="border border-neutral-400 rounded-[10px] bg-white">
          <EmptyState icon={<Mic size={36} />} title="No Dictionaries Yet" description="Organize custom pronunciations into dictionaries." action={{ label: 'Create your first dictionary', onClick: () => {} }} />
        </div>
      </section>
    </div>
  )
}
