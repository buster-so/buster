import type { iconProps } from './iconProps';

function axisDottedY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px axis dotted y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.225 4.237L7.75 1.763 5.275 4.237"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 10.75L7.75 1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="16.75" cy="10.75" fill="currentColor" r=".75" />
        <circle cx="1.75" cy="16.75" fill="currentColor" r=".75" />
        <circle cx="13.75" cy="10.75" fill="currentColor" r=".75" />
        <circle cx="10.75" cy="10.75" fill="currentColor" r=".75" />
        <circle cx="3.75" cy="14.75" fill="currentColor" r=".75" />
        <circle cx="5.75" cy="12.75" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default axisDottedY;
