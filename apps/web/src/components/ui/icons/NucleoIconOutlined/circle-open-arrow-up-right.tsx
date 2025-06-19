import type { iconProps } from './iconProps';

function circleOpenArrowUpRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle open arrow up right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.25 11.25L11.25 6.75 6.75 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 6.75L3.873 14.127"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.873,14.127c-2.831-2.831-2.831-7.422,0-10.253,2.831-2.831,7.422-2.831,10.253,0s2.831,7.422,0,10.253c-2.075,2.075-5.094,2.629-7.674,1.663"
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

export default circleOpenArrowUpRight;
