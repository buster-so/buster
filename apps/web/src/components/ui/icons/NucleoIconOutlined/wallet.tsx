import type { iconProps } from './iconProps';

function wallet(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px wallet';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.25,4.75c0-1.105,.895-2,2-2H12.75c.552,0,1,.448,1,1v.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.25,4.75V13.25c0,1.105,.895,2,2,2H14.75c.552,0,1-.448,1-1V7.75c0-.552-.448-1-1-1H4.25c-1.105,0-2-.895-2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="12.75" cy="11" fill="currentColor" r="1.25" />
      </g>
    </svg>
  );
}

export default wallet;
