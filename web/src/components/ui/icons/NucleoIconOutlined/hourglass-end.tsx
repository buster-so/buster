import type { iconProps } from './iconProps';

function hourglassEnd(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hourglass end';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.75,2.25c0,3.86,.557,5.456,2.46,6.75-1.903,1.294-2.46,2.89-2.46,6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25,2.25c0,3.86-.557,5.456-2.46,6.75,1.903,1.294,2.46,2.89,2.46,6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,10.506c-.741,0-1.79,.529-2.109,2.923-.024,.167,.022,.289,.117,.398,.095,.11,.233,.173,.378,.173h3.229c.145,0,.283-.062,.378-.173,.095-.109,.141-.231,.117-.398-.319-2.394-1.368-2.923-2.109-2.923Z"
          fill="currentColor"
        />
        <path
          d="M3.75 2.25L14.25 2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75 15.75L14.25 15.75"
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

export default hourglassEnd;
