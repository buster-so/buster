import type { iconProps } from './iconProps';

function medicalMask(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px medical mask';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.25,12.5h-1c-1.105,0-2-.895-2-2v-3c0-1.105,.895-2,2-2h1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75,12.5h1c1.105,0,2-.895,2-2v-3c0-1.105-.895-2-2-2h-1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75,9v-3.5c-1.75-.833-3-1.25-4.75-1.25-1.75,0-3,.417-4.75,1.25v7c1.75,.833,3,1.25,4.75,1.25,1.75,0,3-.417,4.75-1.25v-3.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25,10.5c-1.5,.333-3,.333-4.5,0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25,7.5c-1.5-.333-3-.333-4.5,0"
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

export default medicalMask;
