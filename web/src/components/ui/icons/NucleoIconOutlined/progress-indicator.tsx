import type { iconProps } from './iconProps';

function progressIndicator(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px progress indicator';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 10.25L9 15"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.485,6.975l1.97-3.377c.218-.374-.052-.844-.485-.844h-3.94c-.433,0-.703,.47-.485,.844l1.97,3.377c.217,.371,.753,.371,.97,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="5"
          width="14.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="10.25"
        />
      </g>
    </svg>
  );
}

export default progressIndicator;
