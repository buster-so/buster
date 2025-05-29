import type { iconProps } from './iconProps';

function repeat4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px repeat 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12,4.276c2.388,.25,4.25,2.27,4.25,4.724h0c0,2.623-2.127,4.75-4.75,4.75h-2.75l2.5,2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6,13.724c-2.388-.25-4.25-2.27-4.25-4.724h0c0-2.623,2.127-4.75,4.75-4.75h2.75L6.75,1.75"
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

export default repeat4;
