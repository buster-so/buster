import type { iconProps } from './iconProps';

function arrowDotRotateClockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow dot rotate clockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9.25"
          cy="9.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.718,3.694c-.854-1.743-2.646-2.944-4.718-2.944-2.899,0-5.25,2.351-5.25,5.25,0,2.899,2.351,5.25,5.25,5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 3.75L10.75 3.75 10.75 0.75"
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

export default arrowDotRotateClockwise;
