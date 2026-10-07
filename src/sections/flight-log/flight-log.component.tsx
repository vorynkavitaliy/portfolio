import { STATIONS_COPY } from '@/content/stations.content';

const COPY = STATIONS_COPY['flight-log'];

export const FlightLog = () => {
  return (
    <>
      <p
        data-motion="tag"
        className="mb-2.5 flex items-center gap-2.5 font-pixel text-[0.9rem] text-signal before:size-2.5 before:bg-signal before:content-['']"
      >
        {COPY.tag}
      </p>

      <h2
        id="flight-log-title"
        data-motion="title"
        className="m-0 font-pixel text-[1.4rem] leading-[1.05] font-semibold text-balance text-white wide:text-[1.75rem]"
      >
        {COPY.title}
      </h2>

      <ol className="m-0 mt-4 grid list-none gap-3 p-0">
        {COPY.entries.map((entry) => {
          return (
            <li
              key={entry.years}
              data-motion="item"
              className="grid grid-cols-[76px_minmax(0,1fr)] gap-3 wide:grid-cols-[92px_minmax(0,1fr)]"
            >
              <span className="pt-0.5 font-pixel text-[0.95rem] text-signal">{entry.years}</span>

              <div>
                <h3 className="m-0 font-pixel text-base font-medium text-white">{entry.role}</h3>

                <p className="m-0 text-[0.9rem] text-pretty text-muted">{entry.summary}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
};
