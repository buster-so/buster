import type { iconProps } from './iconProps';

function chartActivity2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chart activity 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m11.25,5.75h-2.25l-1.5,4.5L4.5,1.75l-1.5,4.5H.75"
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

export default chartActivity2;
