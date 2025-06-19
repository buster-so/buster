import type { iconProps } from './iconProps';

function droplet(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px droplet';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,16.25c3.038,0,5.5-2.47,5.5-5.517,0-4.191-3.083-5.983-5.5-8.983C6.583,4.75,3.5,6.542,3.5,10.733c0,3.047,2.462,5.517,5.5,5.517Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,13.75c-1.654,0-3-1.354-3-3.017"
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

export default droplet;
