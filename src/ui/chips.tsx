/** 属性・教科の小さな札（色だけに頼らず、ドットアイコン＋文字） */
import type { Element } from '../core/content/schemas';
import { t } from './i18n';
import { PixelIcon } from './PixelIcon';

export function ElementChip({ el }: { el: Element }) {
  return (
    <span class={`nq-chip nq-el-${el}`}>
      <PixelIcon name={`el-${el}`} scale={2} />
      {t(`elements.${el}`)}
    </span>
  );
}

export function SubjectChip({ subject }: { subject: string }) {
  return (
    <span class={`nq-chip nq-subj-${subject}`}>
      <PixelIcon name={`subj-${subject}`} scale={2} />
      {t(`subjects.${subject}`)}
    </span>
  );
}
