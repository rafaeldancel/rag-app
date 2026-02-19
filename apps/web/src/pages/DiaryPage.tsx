import { useState } from 'react'
import { SegmentedControl } from '../components/diary/SegmentedControl'
import { MentorInsightCard } from '../components/diary/MentorInsightCard'
import { DiaryEntryCard } from '../components/diary/DiaryEntryCard'

const SEGMENTS = [
  { value: 'diary', label: 'Diary' },
  { value: 'notes', label: 'Notes' },
  { value: 'highlights', label: 'Highlights' },
]

export function DiaryPage() {
  const [tab, setTab] = useState('diary')

  return (
    <main className="flex-1 overflow-y-auto scrollbar-none space-y-4 pb-4 pt-4">
      <SegmentedControl segments={SEGMENTS} value={tab} onChange={setTab} />

      <MentorInsightCard
        summary="Your recent entries reflect a growing sense of gratitude. Consider how thankfulness can reshape your perspective during challenging seasons."
        verseReference="Psalm 100:4"
        verseText="Enter his gates with thanksgiving and his courts with praise."
      />

      <DiaryEntryCard
        title="A Morning of Unexpected Peace"
        body="I woke up anxious about the presentation but decided to spend 10 minutes in prayer first. The peace that came over me was indescribable — a reminder that I'm not carrying this alone."
        mood="Peaceful"
        moodVariant="green"
        dateTime="Feb 19 · 7:30 AM"
      />

      <DiaryEntryCard
        title="Wrestling with Doubt"
        body="Read about Thomas today. It struck me that Jesus didn't rebuke him for doubting — he showed up and invited him to see the evidence. That feels deeply personal right now."
        mood="Reflective"
        moodVariant="blue"
        dateTime="Feb 18 · 9:15 PM"
      />
    </main>
  )
}
