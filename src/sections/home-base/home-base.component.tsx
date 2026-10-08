import { STATIONS_COPY } from '@/content/stations.content';
import { StationLink } from '@/shared/station-link.client';
import { TrackedLink } from '@/shared/tracked-link.client';

const COPY = STATIONS_COPY['home-base'];

const BUTTON =
  'font-pixel inline-flex h-11 items-center justify-center px-5 text-btn no-underline transition active:translate-y-0.5';

const BUTTON_SIGNAL = `${BUTTON} pixel-edge bg-signal text-on-signal shadow-btn-signal hover:brightness-105`;
const BUTTON_PLAIN = `${BUTTON} pixel-edge bg-surface text-white shadow-btn-plain hover:shadow-btn-plain-hover`;

export const HomeBase = () => {
  return (
    <>
      <p
        data-motion="tag"
        className="mb-2.5 flex items-center gap-2.5 font-pixel text-eyebrow text-signal before:size-2.5 before:bg-signal before:content-['']"
      >
        {COPY.tag}
      </p>

      <h1
        id="home-base-title"
        data-motion="title"
        className="m-0 font-pixel text-title leading-display font-semibold text-balance text-white wide:text-title-wide"
      >
        {COPY.title}
      </h1>

      <p data-motion="lede" className="mt-3 text-lede font-medium text-white">
        {COPY.role}
      </p>

      <p data-motion="lede" className="mt-2.5 text-pretty text-muted">
        {COPY.lede}
      </p>

      <div className="mt-5 flex flex-wrap gap-2.5">
        <div data-motion="item">
          <StationLink station="contact" className={BUTTON_SIGNAL} magnet>
            {COPY.contactCta}
          </StationLink>
        </div>

        <div data-motion="item">
          <TrackedLink
            href={COPY.linkedin.href}
            event={{ name: 'linkedin_click' }}
            external
            className={BUTTON_PLAIN}
          >
            {COPY.linkedin.label}
          </TrackedLink>
        </div>
      </div>

      <div className="mt-5.5 grid grid-cols-2 gap-2">
        {COPY.stats.map((stat) => {
          return (
            <div
              key={stat.caption}
              data-motion="stat"
              className="bg-stat px-3 py-2.5 shadow-outline"
            >
              <b
                data-motion="stat-value"
                className="block font-pixel text-stat-value leading-stat font-normal text-signal wide:text-stat-value-wide"
              >
                {stat.value}
              </b>

              <span className="mt-1 block text-chip-sm leading-label text-muted">
                {stat.caption}
              </span>
            </div>
          );
        })}
      </div>

      <ul className="m-0 mt-4.5 flex list-none flex-wrap gap-1.5 p-0">
        {COPY.chips.map((chip) => {
          return (
            <li
              key={chip}
              data-motion="chip"
              className="bg-surface px-2.25 py-0.75 text-chip-sm shadow-outline"
            >
              {chip}
            </li>
          );
        })}
      </ul>
    </>
  );
};
