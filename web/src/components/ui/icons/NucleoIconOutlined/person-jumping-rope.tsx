import type { iconProps } from './iconProps';

function personJumpingRope(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px person jumping rope';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="2.625"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 13.25L7.25 6.315"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75 6.315L10.75 16.875"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15,7.75c-.572-.099-1.22-.25-1.918-.479-.722-.238-1.355-.514-1.897-.789-.29-.147-.605-.231-.931-.231h-2.509c-.325,0-.641,.084-.931,.231-.542,.275-1.175,.552-1.897,.789-.698,.23-1.346,.38-1.918,.479"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 11.25L10.75 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.238,16.2c-2.815-.373-4.988-2.783-4.988-5.7v-.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75,10v.5c0,1.476-.556,2.822-1.47,3.84"
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

export default personJumpingRope;
