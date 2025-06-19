import type { iconProps } from './iconProps';

function inbox(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px inbox';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.25 6.25L7.75 6.25 7.75 7.75 4.25 7.75 4.25 6.25 0.75 6.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9.25,10.75H2.75c-1.105,0-2-.895-2-2v-2.5l.871-3.485c.223-.89,1.023-1.515,1.94-1.515h4.877c.918,0,1.718.625,1.94,1.515l.871,3.485v2.5c0,1.105-.895,2-2,2Z"
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

export default inbox;
