import type { iconProps } from './iconProps';

function gamepad(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gamepad';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="10.75" cy="8.75" fill="currentColor" r=".75" />
        <circle cx="12.25" cy="6.75" fill="currentColor" r=".75" />
        <path
          d="M6.25 6.5L6.25 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.5 7.75L5 7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.914,11.986l-1.993-6.799c-.25-.852-1.031-1.438-1.919-1.438H4.998c-.888,0-1.669,.585-1.919,1.438l-1.993,6.799c-.051,.163-.086,.333-.086,.514,0,.967,.784,1.75,1.75,1.75,.584,0,1.098-.289,1.415-.728l1.272-1.772h7.124l1.272,1.772c.318,.439,.832,.728,1.415,.728,.966,0,1.75-.783,1.75-1.75,0-.18-.035-.35-.086-.514Z"
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

export default gamepad;
