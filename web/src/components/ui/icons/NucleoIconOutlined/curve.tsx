import type { iconProps } from './iconProps';

function curve(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px curve';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75,14.75c9.25,0,3.25-11.5,12.5-11.5"
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

export default curve;
