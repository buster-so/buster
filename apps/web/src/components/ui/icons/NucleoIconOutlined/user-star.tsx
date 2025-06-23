import type { iconProps } from './iconProps';

function userStar(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user star';

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
        <path
          d="M11.27,10.194c-.705-.277-1.466-.444-2.27-.444-2.551,0-4.739,1.53-5.709,3.72-.365,.825,.087,1.774,.947,2.045,1.225,.386,2.846,.734,4.762,.734"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 10.818L14.754 12.853 17 13.179 15.375 14.763 15.759 17 13.75 15.944 11.741 17 12.125 14.763 10.5 13.179 12.746 12.853 13.75 10.818z"
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

export default userStar;
