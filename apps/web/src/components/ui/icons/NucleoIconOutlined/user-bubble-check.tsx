import type { iconProps } from './iconProps';

function userBubbleCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user bubble check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.75 6.75L12.25 8.25 14.5 4.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,1.75c-2.485,0-4.5,2.014-4.5,4.498,0,.819,.222,1.583,.604,2.245,.267,.5-.033,1.682-.604,2.254,.776,.042,1.798-.308,2.254-.604,.304,.175,.785,.407,1.415,.526,.269,.051,.547,.078,.83,.078,2.485,0,4.5-2.014,4.5-4.498S15.235,1.75,12.75,1.75Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M.75,15.5c0-1.657,1.343-3,3-3h0c1.657,0,3,1.343,3,3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="3.75"
          cy="8.25"
          fill="none"
          r="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default userBubbleCheck;
