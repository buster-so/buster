import type { iconProps } from './iconProps';

function mediaPlay(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px media play';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.245,2.878l9.492,5.256c.685,.379,.685,1.353,0,1.732L5.245,15.122c-.669,.371-1.495-.108-1.495-.866V3.744c0-.758,.825-1.237,1.495-.866Z"
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

export default mediaPlay;
