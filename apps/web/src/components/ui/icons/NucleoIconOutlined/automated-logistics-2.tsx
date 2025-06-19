import type { iconProps } from './iconProps';

function automatedLogistics2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px automated logistics 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="5.5"
          width="5.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="6.25"
          y="2.75"
        />
        <rect
          height="4"
          width="14.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="11.25"
        />
        <path
          d="M1.75,2.75h1c.552,0,1,.448,1,1v3.5c0,.552-.448,1-1,1H1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,2.75h-1c-.552,0-1,.448-1,1v3.5c0,.552,.448,1,1,1h1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 2.75L9 5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy="13.25" fill="currentColor" r=".75" />
        <circle cx="5.75" cy="13.25" fill="currentColor" r=".75" />
        <circle cx="12.25" cy="13.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default automatedLogistics2;
