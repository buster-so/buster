import type { iconProps } from './iconProps';

function moon(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px moon';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13,11.75c-3.452,0-6.25-2.798-6.25-6.25,0-1.352,.433-2.599,1.162-3.622-3.364,.628-5.912,3.575-5.912,7.122,0,4.004,3.246,7.25,7.25,7.25,3.372,0,6.198-2.306,7.009-5.424-.95,.583-2.063,.924-3.259,.924Z"
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

export default moon;
