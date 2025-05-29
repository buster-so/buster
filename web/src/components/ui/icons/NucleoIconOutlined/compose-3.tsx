import type { iconProps } from './iconProps';

function compose3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px compose 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.25,10.5v2.75c0,1.105-.895,2-2,2H4.75c-1.105,0-2-.895-2-2V4.75c0-1.105,.895-2,2-2h3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.429,6.535c-.352,2.737-2.611,3.227-5.01,2.906"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25,11.75S7.3,2.533,16.25,1.75c-.448,.781-.459,2.084-.757,3.392-.419,1.608-1.868,1.808-3.643,1.808"
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

export default compose3;
