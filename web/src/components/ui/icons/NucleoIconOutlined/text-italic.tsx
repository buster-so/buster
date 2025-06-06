import type { iconProps } from './iconProps';

function textItalic(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text italic';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.25 14.25L10.75 5.75 8.25 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 14.25L10.75 14.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="12" cy="2" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default textItalic;
