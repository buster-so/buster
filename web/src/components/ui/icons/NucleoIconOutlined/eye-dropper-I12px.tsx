import type { iconProps } from './iconProps';

function eyeDropper(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px eye dropper';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m8.375,5.875l-4.142,4.142c-.621.621-1.629.621-2.25,0h0c-.621-.621-.621-1.629,0-2.25L6.125,3.625"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M0.75 11.25L2 10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6.125,3.625l2.148-2.148c.621-.621,1.629-.621,2.25,0h0c.621.621.621,1.629,0,2.25l-2.148,2.148"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.5 7L5 2.5"
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

export default eyeDropper;
