import type { Phrase } from '@/lib/content';

/**
 * Renders a {lead, em, tail} phrase. The single italic span is the one
 * typographic flourish in the system, so it is expressed as data rather than
 * as markup embedded in a content string.
 */
export default function Em({ phrase }: { phrase: Phrase }) {
  return (
    <>
      {phrase.lead}
      <em>{phrase.em}</em>
      {phrase.tail}
    </>
  );
}
