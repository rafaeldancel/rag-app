import { useState } from 'react'
import { ReaderToolbar } from '../components/bible/ReaderToolbar'
import { Verse } from '../components/bible/Verse'
import { InlineAIInsight } from '../components/bible/InlineAIInsight'

export function BiblePage() {
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)

  const toggle = (n: number) => setSelectedVerse(v => (v === n ? null : n))

  return (
    <main className="flex-1 overflow-y-auto scrollbar-none">
      <ReaderToolbar translation="ESV" chapterLabel="John 3" />
      <div className="py-2">
        <Verse
          number={16}
          text="For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."
          selected={selectedVerse === 16}
          onPress={() => toggle(16)}
        />
        <Verse
          number={17}
          text="For God did not send his Son into the world to condemn the world, but to save the world through him."
          selected={selectedVerse === 17}
          onPress={() => toggle(17)}
        />
        <InlineAIInsight text="The Greek word agapao (loved) points to unconditional, covenant love — not mere affection. This is the heart of the Gospel." />
        <Verse
          number={18}
          text="Whoever believes in him is not condemned, but whoever does not believe stands condemned already because they have not believed in the name of God's one and only Son."
          selected={selectedVerse === 18}
          onPress={() => toggle(18)}
        />
        <Verse
          number={19}
          text="This is the verdict: Light has come into the world, but people loved darkness instead of light because their deeds were evil."
          selected={selectedVerse === 19}
          onPress={() => toggle(19)}
        />
      </div>
    </main>
  )
}
