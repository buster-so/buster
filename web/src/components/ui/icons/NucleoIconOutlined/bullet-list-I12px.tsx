import type { iconProps } from './iconProps';

function bulletList(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px bullet list';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.75 2.25L10.75 2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 5.25L10.75 5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 8.25L10.75 8.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 11.25L10.75 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="2.25" cy="2.25" fill="currentColor" r="1.75" strokeWidth="0" />
        <circle cx="2.25" cy="8.25" fill="currentColor" r="1.75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default bulletList;
