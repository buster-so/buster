import type { iconProps } from './iconProps';

function eclipse(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px eclipse';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m7.625,1.033c-2.099.687-3.625,2.639-3.625,4.967s1.526,4.28,3.625,4.967"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="6"
          cy="6"
          fill="none"
          r="5.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default eclipse;
