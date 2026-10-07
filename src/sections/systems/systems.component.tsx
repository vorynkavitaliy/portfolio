import { STATIONS_COPY } from '@/content/stations.content';

const COPY = STATIONS_COPY.systems;

export const Systems = () => {
  return (
    <>
      <p
        data-motion="tag"
        className="mb-2.5 flex items-center gap-2.5 font-pixel text-eyebrow text-signal before:size-2.5 before:bg-signal before:content-['']"
      >
        {COPY.tag}
      </p>

      <h2
        id="systems-title"
        data-motion="title"
        className="m-0 font-pixel text-heading leading-display font-semibold text-balance text-white wide:text-heading-wide"
      >
        {COPY.title}
      </h2>

      <p data-motion="lede" className="mt-2.5 text-pretty text-muted">
        {COPY.lede}
      </p>

      <div className="mt-4 grid gap-3.5">
        {COPY.groups.map((group) => {
          return (
            <div key={group.title} data-motion="item">
              <h3 className="m-0 mb-1.5 font-pixel text-subhead font-medium text-white">
                {group.title}

                {group.years === null ? null : (
                  <em className="ml-1 text-signal not-italic">{group.years}</em>
                )}
              </h3>

              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {group.items.map((item) => {
                  return (
                    <li
                      key={item.name}
                      data-motion="chip"
                      className="bg-surface px-2.25 py-0.75 text-chip shadow-outline"
                    >
                      {item.name}

                      {item.years === null ? null : (
                        <em className="ml-1 font-pixel text-signal not-italic">{item.years}</em>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
};
