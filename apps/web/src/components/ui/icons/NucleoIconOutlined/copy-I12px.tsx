import type { iconProps } from './iconProps';

function copy(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px copy';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="8"
          width="8"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 7.25 4.75)"
          x="3.25"
          y=".75"
        />
        <path
          d="m8.25,11.25H2.25c-.828,0-1.5-.672-1.5-1.5V3.75"
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

export default copy;
