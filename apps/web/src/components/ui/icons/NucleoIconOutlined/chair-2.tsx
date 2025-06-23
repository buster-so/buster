import type { iconProps } from './iconProps';

function chair2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chair 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 12.75L9 16.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 14.5L5.75 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 14.5L12.25 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.187,7.765l-.404,3.233c-.125,1.001-.976,1.752-1.985,1.752h-3.798s-3.798,0-3.798,0c-1.009,0-1.859-.751-1.985-1.752l-.404-3.233"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75,10.25l-.737-6.266c-.14-1.189,.789-2.234,1.986-2.234h4.002c1.197,0,2.126,1.045,1.986,2.234l-.737,6.266"
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

export default chair2;
