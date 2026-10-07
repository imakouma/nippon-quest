import type { Area, Motif } from '../../core/content/schemas';
import { villagerMotif } from '../../core/progression/town';
import type { DialogueLine } from '../../ui/dialogue';

const roleNameKeys: Record<string, string> = {
  shop: 'field.roleShop',
  inn: 'field.roleInn',
  smith: 'field.roleSmith',
  board: 'field.roleBoard',
  dex: 'field.roleDex',
  arena: 'field.roleArena',
  ferry: 'field.roleFerry',
};

const jobNameKeys: Record<Motif['kind'], string> = {
  food: 'field.jobFood',
  craft: 'field.jobCraft',
  landmark: 'field.jobLandmark',
  nature: 'field.jobNature',
  festival: 'field.jobFestival',
  history: 'field.jobHistory',
};

export interface NpcModel {
  role: string;
  name: string;
  lines: DialogueLine[];
}

/** マップ上の NPC と content の会話を突き合わせ、表示する役割・名前・会話を決める。 */
export function npcModel(input: {
  area: Area | undefined;
  objectName: string;
  objectRole: unknown;
  text: (key: string, vars?: Record<string, string>) => string;
}): NpcModel {
  const { area, objectName, objectRole, text } = input;
  const role = String(objectRole ?? objectName.replace(/^npc_/, ''));
  const townNpcs = area?.town?.npcs ?? [];
  const info =
    townNpcs.find((npc) => npc.id === objectName) ??
    (role === 'talk' ? undefined : townNpcs.find((npc) => npc.role === role));
  const resolvedRole = info?.role ?? role;
  const motif = villagerMotif(area, objectName);
  const fallbackLines = motif
    ? [{ text: text('field.villagerTip', { name: motif.name }) }, { text: motif.blurb }]
    : [{ text: text('field.villagerHello', { town: area?.town?.name ?? area?.name ?? '' }) }];
  return {
    role: resolvedRole,
    name:
      info?.name ??
      (resolvedRole === 'talk'
        ? text(jobNameKeys[motif?.kind ?? 'food'] ?? 'field.npcDefault')
        : text(roleNameKeys[resolvedRole] ?? 'field.npcDefault')),
    lines: info?.dialogue ?? fallbackLines,
  };
}
