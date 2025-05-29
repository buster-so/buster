import type { iconProps } from './iconProps';

function nut(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px nut';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="6"
          cy="6"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m7.871,1.25h-3.743c-.54,0-1.038.289-1.309.758l-1.865,3.23c-.272.472-.272,1.053,0,1.525l1.865,3.23c.271.469.77.758,1.309.758h3.743c.54,0,1.038-.289,1.309-.758l1.865-3.23c.272-.472.272-1.053,0-1.525l-1.865-3.23c-.271-.469-.77-.758-1.309-.758Z"
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

export default nut;
