import type { iconProps } from './iconProps';

function chartUsage(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart usage';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.602,6c.416,.914,.648,1.93,.648,3,0,2.066-.864,3.929-2.25,5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4,14.25c-1.386-1.321-2.25-3.184-2.25-5.25C1.75,4.996,4.996,1.75,9,1.75c1.938,0,3.699,.761,5,2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7 11.25L11 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="7" cy="7" fill="currentColor" r="1" />
        <circle cx="11" cy="11" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default chartUsage;
