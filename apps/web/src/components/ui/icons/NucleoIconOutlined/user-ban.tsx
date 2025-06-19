import type { iconProps } from './iconProps';

function userBan(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user ban';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="4.5"
          fill="none"
          r="2.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="14"
          cy="14"
          fill="none"
          r="3.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.039,9.843c-.338-.057-.684-.093-1.039-.093-2.551,0-4.739,1.53-5.709,3.72-.365,.825,.087,1.774,.947,2.045,1.159,.366,2.683,.687,4.465,.721"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.702 16.298L16.292 11.708"
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

export default userBan;
