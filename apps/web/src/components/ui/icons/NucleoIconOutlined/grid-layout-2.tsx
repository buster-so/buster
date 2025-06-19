import type { iconProps } from './iconProps';

function gridLayout2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px grid layout 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="4.5"
          width="3.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="11.75"
          y="2.75"
        />
        <rect
          height="4.5"
          width="6"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="2.75"
        />
        <rect
          height="4.5"
          width="3.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="10.75"
        />
        <rect
          height="4.5"
          width="6"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="9.25"
          y="10.75"
        />
      </g>
    </svg>
  );
}

export default gridLayout2;
