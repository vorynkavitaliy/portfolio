import { STATIONS_COPY } from '@/content/stations.content';
import { StationLink } from '@/shared/station-link.client';
import { TrackedLink } from '@/shared/tracked-link.client';

type HomeBaseProps = Readonly<{ cvHref: string | null }>;

const COPY = STATIONS_COPY['home-base'];

const BUTTON =
  'font-pixel inline-flex h-11 items-center justify-center px-5 text-[1.05rem] no-underline transition active:translate-y-0.5';

const BUTTON_SIGNAL = `${BUTTON} pixel-edge bg-signal text-on-signal shadow-[inset_0_-4px_0_rgb(0_0_0/0.28)] hover:brightness-105`;
const BUTTON_PLAIN = `${BUTTON} pixel-edge bg-surface text-white shadow-[inset_0_0_0_2px_var(--color-edge-dim),inset_0_-4px_0_rgb(0_0_0/0.3)] hover:shadow-[inset_0_0_0_2px_var(--color-edge),inset_0_-4px_0_rgb(0_0_0/0.3)]`;

export const HomeBase = ({ cvHref }: HomeBaseProps) => {
  return (
    <>
      <p
        data-motion="tag"
        className="mb-2.5 flex items-center gap-2.5 font-pixel text-[0.9rem] text-signal before:size-2.5 before:bg-signal before:content-['']"
      >
        {COPY.tag}
      </p>

      <h1
        id="home-base-title"
        data-motion="title"
        className="m-0 font-pixel text-[2rem] leading-[1.05] font-semibold text-balance text-white wide:text-[2.6rem]"
      >
        {COPY.title}
      </h1>

      <p data-motion="lede" className="mt-3 text-[1.15rem] font-medium text-white">
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
          {cvHref === null ? (
            <button
              type="button"
              disabled
              data-cv-placeholder=""
              className={`${BUTTON_PLAIN} cursor-not-allowed opacity-60`}
            >
              {COPY.cv.label}
            </button>
          ) : (
            <TrackedLink
              href={cvHref}
              event={{ name: 'cv_download' }}
              download
              className={BUTTON_PLAIN}
            >
              {COPY.cv.label}
            </TrackedLink>
          )}
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
              className="bg-stat px-3 py-2.5 shadow-[inset_0_0_0_1px_var(--color-edge-dim)]"
            >
              <b
                data-motion="stat-value"
                className="block font-pixel text-[1.25rem] leading-[1.1] font-normal text-signal wide:text-[1.6rem]"
              >
                {stat.value}
              </b>

              <span className="mt-1 block text-[0.8rem] leading-[1.3] text-muted">
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
              className="bg-surface px-2.25 py-0.75 text-[0.8rem] shadow-[inset_0_0_0_1px_var(--color-edge-dim)]"
            >
              {chip}
            </li>
          );
        })}
      </ul>
    </>
  );
};
