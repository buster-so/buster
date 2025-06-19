import type { iconProps } from './iconProps';

function helicopter(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px helicopter';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75 2.25L16.25 2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 5.25L9 1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 5.25L9 9.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.457,5.25h3.086c1.261,0,2.324,.939,2.481,2.19l.375,3c.187,1.492-.977,2.81-2.481,2.81h-3.836c-1.504,0-2.667-1.318-2.481-2.81l.375-3c.156-1.251,1.22-2.19,2.481-2.19Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,16.25c0-1.657,1.343-3,3-3h4.5c1.657,0,3,1.343,3,3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.312 9.75L4.688 9.75"
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

export default helicopter;
