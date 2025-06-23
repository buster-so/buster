import type { iconProps } from './iconProps';

function umbrella(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px umbrella';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,7.75c1.486,0,2.306,1.15,2.375,1.25,.077-.106,.96-1.282,2.5-1.25,1.463,.03,2.285,1.126,2.375,1.25,0-4.004-3.246-7.25-7.25-7.25C4.996,1.75,1.75,4.996,1.75,9c.09-.124,.912-1.22,2.375-1.25,1.54-.032,2.423,1.144,2.5,1.25,.069-.1,.889-1.25,2.375-1.25Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75,14.625c0,.897,.728,1.625,1.625,1.625s1.625-.728,1.625-1.625v-4.125"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.625,9c0-4.004,1.063-7.25,2.375-7.25s2.375,3.246,2.375,7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 0.75L9 1.75"
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

export default umbrella;
