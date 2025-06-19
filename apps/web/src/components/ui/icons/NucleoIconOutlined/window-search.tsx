import type { iconProps } from './iconProps';

function windowSearch(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px window search';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="4.25" cy="5.25" fill="currentColor" r=".75" />
        <circle cx="6.75" cy="5.25" fill="currentColor" r=".75" />
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
        <path
          d="M1.75 7.75L16.25 7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,9.784V4.75c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2V13.25c0,1.104,.895,2,2,2h5.653"
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
      </g>
    </svg>
  );
}

export default windowSearch;
