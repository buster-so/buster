import type { iconProps } from './iconProps';

function router(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px router';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="5"
          width="14.5"
          fill="none"
          rx="2.5"
          ry="2.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="10.75"
        />
        <circle cx="4.25" cy="13.25" fill="currentColor" r=".75" />
        <circle cx="6.75" cy="13.25" fill="currentColor" r=".75" />
        <circle
          cx="11.75"
          cy="4.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.568,7.432c-1.757-1.757-1.757-4.607,0-6.364"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.932,7.432c1.757-1.757,1.757-4.607,0-6.364"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75 5.75L11.75 10.75"
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

export default router;
