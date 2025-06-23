import type { iconProps } from './iconProps';

function msgBubbleUser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px msg bubble user';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.25,1.25c-2.209,0-4,1.791-4,4,0,.728,.197,1.408,.537,1.996,.237,.445-.029,1.496-.537,2.004,.69,.037,1.598-.274,2.004-.537,.27,.156,.698,.362,1.258,.468,.239,.045,.486,.069,.738,.069,2.209,0,4-1.791,4-4S15.459,1.25,13.25,1.25Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M.75,16c.525-1.597,2.028-2.75,3.801-2.75s3.276,1.153,3.801,2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="4.551"
          cy="8.75"
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

export default msgBubbleUser;
