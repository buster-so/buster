import type { iconProps } from './iconProps';

function camera3Off(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px camera 3 off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.336,14.664c-.362-.362-.586-.862-.586-1.414V4.75c0-1.105,.895-2,2-2H13.25c.552,0,1.052,.224,1.414,.586"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,6.285v6.965c0,1.105-.895,2-2,2H6.285"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.055,10.945c-.498-.498-.805-1.185-.805-1.945,0-1.519,1.231-2.75,2.75-2.75,.759,0,1.447,.308,1.945,.805"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.579,9.956c-.278,.75-.873,1.345-1.623,1.623"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 16L16 2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.25" cy="5.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default camera3Off;
