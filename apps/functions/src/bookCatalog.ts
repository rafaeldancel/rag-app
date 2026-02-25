// ── Book Catalog ────────────────────────────────────────────────────────────
//
// Keyed by "${author}_${title}" matching the filename convention in gcsIngest.ts.
// e.g. "craig_reasonable-faith" from tier0_logic-science_craig_reasonable-faith.pdf
//
// Used to enrich Firestore doc metadata with proper APA citation data and
// a public URL for readers to access the source.

export interface BookEntry {
  fullTitle: string
  /** APA-style author: "Last, F. M." or "Last, F. M., & Last2, F. M." */
  authorFormatted: string
  /** Publication year, e.g. "2008" or "c. 93 CE" for ancient works */
  year: string
  publisher: string
  /** Public link — Goodreads, Project Gutenberg, Bible Gateway, etc. */
  url?: string
}

export const BOOK_CATALOG: Record<string, BookEntry> = {
  // ── Tier 0: Logic & Science ──────────────────────────────────────────────

  'craig_reasonable-faith': {
    fullTitle: 'Reasonable Faith: Christian Truth and Apologetics',
    authorFormatted: 'Craig, W. L.',
    year: '2008',
    publisher: 'Crossway',
    url: 'https://www.goodreads.com/book/show/61698.Reasonable_Faith',
  },
  'meyer_return-of-god-hypothesis': {
    fullTitle:
      'Return of the God Hypothesis: Compelling Scientific Evidence for the Existence of God',
    authorFormatted: 'Meyer, S. C.',
    year: '2021',
    publisher: 'HarperOne',
    url: 'https://www.goodreads.com/book/show/49664539-return-of-the-god-hypothesis',
  },
  'knechtle_give-me-an-answer': {
    fullTitle: 'Give Me an Answer',
    authorFormatted: 'Knechtle, C.',
    year: '1986',
    publisher: 'InterVarsity Press',
    url: 'https://www.goodreads.com/book/show/2127174.Give_Me_an_Answer',
  },
  'dawkins_god-delusion': {
    fullTitle: 'The God Delusion',
    authorFormatted: 'Dawkins, R.',
    year: '2006',
    publisher: 'Houghton Mifflin',
    url: 'https://www.goodreads.com/book/show/14743.The_God_Delusion',
  },
  'hitchens_god-is-not-great': {
    fullTitle: 'God Is Not Great: How Religion Poisons Everything',
    authorFormatted: 'Hitchens, C.',
    year: '2007',
    publisher: 'Twelve',
    url: 'https://www.goodreads.com/book/show/105300.God_Is_Not_Great',
  },
  'russell_why-i-am-not-christian': {
    fullTitle: 'Why I Am Not a Christian and Other Essays on Religion and Related Subjects',
    authorFormatted: 'Russell, B.',
    year: '1957',
    publisher: 'Simon & Schuster',
    url: 'https://archive.org/details/whyiamnotachrist0000russ',
  },

  // ── Tier 1: History & Provenance ─────────────────────────────────────────

  'wright_resurrection-son-of-god': {
    fullTitle: 'The Resurrection of the Son of God',
    authorFormatted: 'Wright, N. T.',
    year: '2003',
    publisher: 'Fortress Press',
    url: 'https://www.goodreads.com/book/show/182163.The_Resurrection_of_the_Son_of_God',
  },
  'blomberg_historical-reliability-nt': {
    fullTitle: 'The Historical Reliability of the New Testament',
    authorFormatted: 'Blomberg, C. L.',
    year: '2016',
    publisher: 'B&H Academic',
    url: 'https://www.goodreads.com/book/show/28243566-the-historical-reliability-of-the-new-testament',
  },
  'smith_was-the-tomb-empty': {
    fullTitle: 'Was the Tomb Empty?',
    authorFormatted: 'Smith, R. S.',
    year: '2016',
    publisher: 'Christian Focus Publications',
    url: 'https://www.goodreads.com/book/show/29430786-was-the-tomb-empty',
  },
  'josephus_antiquities-of-the-jews': {
    fullTitle: 'Antiquities of the Jews',
    authorFormatted: 'Josephus, F.',
    year: 'c. 93 CE',
    publisher: 'Trans. W. Whiston',
    url: 'https://www.gutenberg.org/ebooks/2848',
  },
  'tacitus_annals-of-imperial-rome': {
    fullTitle: 'The Annals of Imperial Rome',
    authorFormatted: 'Tacitus, C.',
    year: 'c. 117 CE',
    publisher: 'Trans. M. Grant',
    url: 'https://www.gutenberg.org/ebooks/10890',
  },
  'suetonius_lives-of-the-caesars': {
    fullTitle: 'The Lives of the Twelve Caesars',
    authorFormatted: 'Suetonius, G. T.',
    year: 'c. 121 CE',
    publisher: 'Trans. A. Thomson',
    url: 'https://www.gutenberg.org/ebooks/6400',
  },
  pliny_letters: {
    fullTitle: 'Letters',
    authorFormatted: 'Pliny the Younger',
    year: 'c. 100 CE',
    publisher: 'Trans. W. Melmoth',
    url: 'https://www.gutenberg.org/ebooks/2811',
  },
  'mara-bar-serapion_letter-to-serapion': {
    fullTitle: 'Letter to His Son Serapion',
    authorFormatted: 'Mara bar Serapion',
    year: 'c. 73 CE',
    publisher: 'Historical document',
    url: 'https://en.wikipedia.org/wiki/Mara_bar_Serapion',
  },
  'ehrman_misquoting-jesus-and-jesus-interrupted': {
    fullTitle: 'Misquoting Jesus & Jesus, Interrupted',
    authorFormatted: 'Ehrman, B. D.',
    year: '2005–2009',
    publisher: 'HarperOne',
    url: 'https://www.goodreads.com/author/show/1479785.Bart_D_Ehrman',
  },

  // ── Tier 2: Ethics & Meaning ─────────────────────────────────────────────

  'frankl_mans-search-for-meaning': {
    fullTitle: "Man's Search for Meaning",
    authorFormatted: 'Frankl, V. E.',
    year: '1959',
    publisher: 'Beacon Press',
    url: 'https://www.goodreads.com/book/show/4069.Man_s_Search_for_Meaning',
  },
  'lewis_abolition-of-man': {
    fullTitle: 'The Abolition of Man',
    authorFormatted: 'Lewis, C. S.',
    year: '1943',
    publisher: 'Oxford University Press',
    url: 'https://www.goodreads.com/book/show/209736.The_Abolition_of_Man',
  },
  'nietzsche_thus-spoke-zarathustra': {
    fullTitle: 'Thus Spoke Zarathustra: A Book for All and None',
    authorFormatted: 'Nietzsche, F.',
    year: '1885',
    publisher: 'Trans. W. Kaufmann. Penguin',
    url: 'https://www.gutenberg.org/ebooks/1998',
  },
  'camus_myth-of-sisyphus': {
    fullTitle: 'The Myth of Sisyphus',
    authorFormatted: 'Camus, A.',
    year: '1942',
    publisher: "Trans. J. O'Brien. Vintage",
    url: 'https://www.goodreads.com/book/show/11987.The_Myth_of_Sisyphus_and_Other_Essays',
  },
  'sartre_existentialism-and-humanism': {
    fullTitle: 'Existentialism and Humanism',
    authorFormatted: 'Sartre, J.-P.',
    year: '1946',
    publisher: 'Trans. P. Mairet. Methuen',
    url: 'https://www.goodreads.com/book/show/51985.Existentialism_and_Human_Emotions',
  },

  // ── Bible ────────────────────────────────────────────────────────────────

  'niv_holy-bible': {
    fullTitle: 'Holy Bible: New International Version',
    authorFormatted: 'Biblica',
    year: '2011',
    publisher: 'Zondervan',
    url: 'https://www.biblegateway.com',
  },
}

export function lookupBook(author: string, title: string): BookEntry | null {
  return BOOK_CATALOG[`${author}_${title}`] ?? null
}

/** Returns a full APA-style book citation string. */
export function formatAPA(entry: BookEntry): string {
  return `${entry.authorFormatted} (${entry.year}). ${entry.fullTitle}. ${entry.publisher}.`
}
