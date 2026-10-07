import { STATIONS_COPY } from '@/content/stations.content';

import type { BriefStationId } from '@/content/content.types';

type MissionBriefProps = Readonly<{ station: BriefStationId }>;

export const MissionBrief = ({ station }: MissionBriefProps) => {
  const copy = STATIONS_COPY[station];

  return (
    <>
      <p
        data-motion="tag"
        className="mb-2.5 flex items-center gap-2.5 font-pixel text-[0.9rem] text-signal before:size-2.5 before:bg-signal before:content-['']"
      >
        {copy.tag}
      </p>

      <h2
        id={`${station}-title`}
        data-motion="title"
        className="m-0 font-pixel text-[1.4rem] leading-[1.05] font-semibold text-balance text-white wide:text-[1.75rem]"
      >
        {copy.title}
      </h2>

      <p data-motion="lede" className="mt-2.5 text-pretty text-muted">
        {copy.lede}
      </p>

      <ul className="m-0 mt-3.5 grid list-none gap-2 p-0">
        {copy.items.map((item) => {
          return (
            <li
              key={item}
              data-motion="item"
              className="relative pl-4.5 before:absolute before:top-[0.6em] before:left-0 before:size-1.5 before:bg-edge before:content-['']"
            >
              {item}
            </li>
          );
        })}
      </ul>

      <ul className="m-0 mt-4.5 flex list-none flex-wrap gap-1.5 p-0">
        {copy.chips.map((chip) => {
          return (
            <li
              key={chip}
              data-motion="chip"
              className="bg-surface px-2.25 py-0.75 text-[0.8rem] shadow-[inset_0_0_0_1px_var(--color-edge-dim)]"
            >
              {chip}
            </li>
          );
        })}
      </ul>

      <p
        data-motion="result"
        className="mt-4 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 bg-result-bg px-3 py-2.5 shadow-[inset_0_0_0_1px_var(--color-result-edge)]"
      >
        <b className="font-pixel text-[1.25rem] font-normal text-signal">{copy.result.value}</b>

        <span className="text-[0.9rem] text-result-text">{copy.result.caption}</span>
      </p>
    </>
  );
};
