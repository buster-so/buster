import type { iconProps } from './iconProps';

function imageBinary(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px image binary';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4 14.75L9.75 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.75,14.75H3.75c-1.105,0-2-.895-2-2V5.25c0-1.105,.895-2,2-2h6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75,7.75V2.75s-.573,1.008-1.788,1.24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.75 1.75L9.75 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.75" cy="7.25" fill="currentColor" r="1.25" />
        <ellipse
          cx="14.75"
          cy="12.75"
          fill="none"
          rx="1.75"
          ry="2.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default imageBinary;
