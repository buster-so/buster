import type { iconProps } from './iconProps';

function directions(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px directions';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 1.75L9 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 16.25L12.25 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,6.25H3.884c-.247,0-.485-.091-.669-.257l-1.389-1.25c-.441-.397-.441-1.089,0-1.487l1.389-1.25c.184-.165,.422-.257,.669-.257h5.116"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.495,10.75h2.616c.247,0,.485-.091,.669-.257l1.389-1.25c.441-.397,.441-1.089,0-1.487l-1.389-1.25c-.184-.165-.422-.257-.669-.257h-2.616"
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

export default directions;
