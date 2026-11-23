import { CircleQuestionMark, Flag, MessageSquareText, Scale, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { MeetingCard } from '../content/types';
import { RichText } from './RichText';

export type MeetingPartName = 'Say' | 'Ask' | 'Red flags' | 'Trade-off';

export const meetingPartOrder: MeetingPartName[] = ['Say', 'Ask', 'Red flags', 'Trade-off'];

export const meetingPartInfo: Record<
  MeetingPartName,
  { hint: string; Icon: LucideIcon; tone: string }
> = {
  Say: {
    hint: 'Phrases that show you know the concept and can explain it plainly.',
    Icon: MessageSquareText,
    tone: 'text-accent',
  },
  Ask: {
    hint: 'Questions that surface the real constraint or the missing context.',
    Icon: CircleQuestionMark,
    tone: 'text-accent',
  },
  'Red flags': {
    hint: 'Signs in a design, a diff or a plan that something is off.',
    Icon: Flag,
    tone: 'text-bad',
  },
  'Trade-off': {
    hint: 'The cost on the other side of the usual advice, in one sentence.',
    Icon: Scale,
    tone: 'text-accent',
  },
};

export function MeetingPartLabel({ name }: { name: MeetingPartName }) {
  const { Icon, tone } = meetingPartInfo[name];
  return (
    <p className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.09em] text-muted">
      <Icon aria-hidden="true" size={14} className={tone} />
      {name}
    </p>
  );
}

function CardPart({ name, children }: { name: MeetingPartName; children: ReactNode }) {
  return (
    <section className="grid content-start gap-2 rounded-xl bg-surface-2 p-3.5">
      <MeetingPartLabel name={name} />
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-1.5 text-[0.9rem] leading-snug">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2">
          <span aria-hidden="true" className="mt-[0.55em] size-1 shrink-0 rounded-full bg-muted" />
          <span>
            <RichText text={item} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function MeetingCardView({ card }: { card: MeetingCard }) {
  return (
    <div className="@container">
      <div className="grid gap-3 @2xl:grid-cols-2">
        <CardPart name="Say">
          <BulletList items={card.say} />
        </CardPart>
        <CardPart name="Ask">
          <BulletList items={card.ask} />
        </CardPart>
        <CardPart name="Red flags">
          <BulletList items={card.redFlags} />
        </CardPart>
        <CardPart name="Trade-off">
          <p className="text-[0.9rem] leading-snug">
            <RichText text={card.tradeoff} />
          </p>
        </CardPart>
      </div>
    </div>
  );
}
