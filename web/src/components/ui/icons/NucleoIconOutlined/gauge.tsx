import type { iconProps } from './iconProps';

function gauge(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gauge';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m4.009,15.25h9.982c1.389-1.321,2.259-3.182,2.259-5.25,0-4.004-3.246-7.25-7.25-7.25S1.75,5.996,1.75,10c0,2.068.87,3.929,2.259,5.25Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 10L5.644 6.644"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m4.8156,9.3508c-.0331.2131-.0656.427-.0656.6492,0,.8096.2251,1.5815.6475,2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m12.6025,12.25c.4224-.6685.6475-1.4404.6475-2.25,0-2.3433-1.9067-4.25-4.25-4.25-.2223,0-.436.0325-.6492.0657"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="10"
          fill="currentColor"
          r="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default gauge;
