import type { iconProps } from './iconProps';

function heart2Broken(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart 2 broken';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.999 4.927L7.75 7 10.5 8.75 8.5 10.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.2,9.222l-5.48,5.694c-.393,.409-1.048,.409-1.441,0L2.799,9.222c-1.452-1.528-1.389-3.944,.139-5.395,1.528-1.452,3.944-1.389,5.395,.139,.27,.284,.495,.609,.666,.962,1.074-2.212,4.002-2.92,6.007-1.162,.535,.469,.929,1.101,1.11,1.79,.363,1.383-.034,2.738-.916,3.666Z"
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

export default heart2Broken;
