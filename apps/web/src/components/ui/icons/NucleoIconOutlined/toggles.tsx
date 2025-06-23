import type { iconProps } from './iconProps';

function toggles(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px toggles';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.408,2.25h5.342c1.381,0,2.5,1.119,2.5,2.5h0c0,1.381-1.119,2.5-2.5,2.5H7.408"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.591,15.75H5.25c-1.381,0-2.5-1.119-2.5-2.5h0c0-1.381,1.119-2.5,2.5-2.5h5.344"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="5.75"
          cy="4.75"
          fill="none"
          r="3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="12.25"
          cy="13.25"
          fill="none"
          r="3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default toggles;
