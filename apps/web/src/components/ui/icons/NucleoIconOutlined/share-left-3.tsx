import type { iconProps } from './iconProps';

function shareLeft3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px share left 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.25,6.5V2.75L1.75,8.417l6.5,5.833v-3.75c5.25,0,8,3.75,8,3.75,0,0,0-7.75-8-7.75Z"
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

export default shareLeft3;
