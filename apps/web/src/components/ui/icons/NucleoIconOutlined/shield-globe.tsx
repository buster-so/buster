import type { iconProps } from './iconProps';

function shieldGlobe(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shield globe';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <ellipse
          cx="12.75"
          cy="12.75"
          fill="none"
          rx="1.862"
          ry="4.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25 12.75L17.25 12.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,6.22v-1.74c0-.435-.281-.82-.695-.952l-5.25-1.68c-.198-.063-.411-.063-.609,0L3.445,3.528c-.414,.133-.695,.517-.695,.952v6.52c0,1.857,1.759,3.219,3.411,4.091"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="12.75"
          cy="12.75"
          fill="none"
          r="4.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default shieldGlobe;
