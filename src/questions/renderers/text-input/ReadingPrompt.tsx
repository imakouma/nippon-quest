import { parseRuby } from '../../../ui/ruby';
import { RubyLabel } from '../../../ui/RubyLabel';

/** 読みを伏せている漢字だけを強調し、補助のルビはそのまま残す。 */
export function ReadingPrompt({ text, grade }: { text: string; grade: number }) {
  return (
    <p>
      {parseRuby(text).map((segment, index) =>
        segment.ruby ? (
          <RubyLabel key={index} text={`${segment.base}[${segment.ruby}]`} grade={grade} />
        ) : (
          segment.base
            .split(/([一-鿿]+)/u)
            .map((part, partIndex) =>
              /^[一-鿿]+$/u.test(part) ? <mark key={`${index}-${partIndex}`}>{part}</mark> : part,
            )
        ),
      )}
    </p>
  );
}
