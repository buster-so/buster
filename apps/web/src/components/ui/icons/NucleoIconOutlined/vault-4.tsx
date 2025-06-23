import type { iconProps } from './iconProps';

function vault4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px vault 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="12.25" cy="12.75" fill="currentColor" r=".75" />
        <circle cx="9.75" cy="12.75" fill="currentColor" r=".75" />
        <circle cx="12.25" cy="10.25" fill="currentColor" r=".75" />
        <circle cx="9.75" cy="10.25" fill="currentColor" r=".75" />
        <path
          d="M1.25 9L3.25 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.25 5.75L3.25 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.25 12.25L3.25 12.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75 15.25L4.75 17"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25 15.25L13.25 17"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 5.25H13.25V7.75H8.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="12.5"
          width="13.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.25"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default vault4;
