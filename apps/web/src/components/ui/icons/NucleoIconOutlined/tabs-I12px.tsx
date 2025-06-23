import type { iconProps } from './iconProps';

function tabs(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px tabs';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m5.75,1.25h3c1.105,0,2,.895,2,2v1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.75,4.5h-5V1.25h-2.5c-1.105,0-2,.895-2,2v5.5c0,1.105.895,2,2,2h5.5c1.105,0,2-.895,2-2v-4.25Z"
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

export default tabs;
