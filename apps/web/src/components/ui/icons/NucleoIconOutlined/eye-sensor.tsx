import type { iconProps } from './iconProps';

function eyeSensor(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px eye sensor';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.282,10.424c.671,.76,.671,1.893,0,2.653-1.101,1.247-3.162,2.924-6.282,2.924s-5.181-1.677-6.282-2.924c-.671-.76-.671-1.893,0-2.653,1.101-1.247,3.162-2.924,6.282-2.924s5.181,1.677,6.282,2.924Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.757,2.507C7.101,.164,10.899,.164,13.243,2.507"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.879,4.629c1.172-1.172,3.071-1.172,4.243,0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="11.75"
          fill="currentColor"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default eyeSensor;
