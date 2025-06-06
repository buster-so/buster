import type { iconProps } from './iconProps';

function globeSearch(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px globe search';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.795,16.207c-.261,.029-.527,.043-.795,.043-4.004,0-7.25-3.246-7.25-7.25S4.996,1.75,9,1.75s7.25,3.246,7.25,7.25c0,.269-.015,.534-.043,.795"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,9c0-1.657-3.246-3-7.25-3S1.75,7.343,1.75,9c0,1.657,3.246,3,7.25,3,.234,0,.464-.005,.692-.014"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.986,9.699c.009-.23,.014-.463,.014-.699,0-4.004-1.343-7.25-3-7.25-1.657,0-3,3.246-3,7.25s1.343,7.25,3,7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.59 15.59L17.25 17.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="14"
          cy="14"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default globeSearch;
