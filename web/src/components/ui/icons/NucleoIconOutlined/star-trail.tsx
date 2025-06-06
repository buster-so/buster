import type { iconProps } from './iconProps';

function starTrail(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px star trail';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.9851 1.75L10.6443 4.4354 14.9306 2.9443 13.5072 7.2539 16.25 10.8696 11.7117 10.8474 9.1208 14.5736 7.7392 10.2507 3.3946 8.9378 7.0788 6.2879 6.9851 1.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 16L5 13"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 12.25L2.25 11.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 16.25L6.25 15.75"
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

export default starTrail;
