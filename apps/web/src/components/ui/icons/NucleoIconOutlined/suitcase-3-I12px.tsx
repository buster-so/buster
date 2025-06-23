import type { iconProps } from './iconProps';

function suitcase3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px suitcase 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m.75,6.75c3.547,1.337,7.047,1.337,10.5,0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 8.75L6 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m3.75,3.75V1.75c0-.552.448-1,1-1h2.5c.552,0,1,.448,1,1v2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="7"
          width="10.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x=".75"
          y="3.75"
        />
      </g>
    </svg>
  );
}

export default suitcase3;
