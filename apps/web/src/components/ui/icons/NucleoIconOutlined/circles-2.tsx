import type { iconProps } from './iconProps';

function circles2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circles 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="1.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.995" cy="12.005" fill="currentColor" r=".75" />
        <circle cx="14.127" cy="3.873" fill="currentColor" r=".75" />
        <path
          d="M9,13.25c2.347,0,4.25-1.903,4.25-4.25s-1.903-4.25-4.25-4.25-4.25,1.903-4.25,4.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.375,2.156c-.745-.259-1.542-.406-2.375-.406C4.996,1.75,1.75,4.996,1.75,9s3.246,7.25,7.25,7.25,7.25-3.246,7.25-7.25c0-.833-.148-1.63-.406-2.375"
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

export default circles2;
