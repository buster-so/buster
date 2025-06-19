import type { iconProps } from './iconProps';

function chartPie(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart pie';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.602,12c-1.141,2.507-3.668,4.25-6.602,4.25-4.004,0-7.25-3.246-7.25-7.25,0-2.934,1.743-5.461,4.25-6.602"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,9c0-4.004-3.246-7.25-7.25-7.25v7.25h7.25Z"
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

export default chartPie;
