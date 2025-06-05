import type { iconProps } from './iconProps';

function repeat2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px repeat 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.75 11.25L7.258 13.742 9.75 16.235"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75,4.25c1.105,0,2,.895,2,2v5.5c0,1.105-.895,2-2,2H7.258"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25 6.742L10.742 4.25 8.25 1.758"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25,13.75c-1.105,0-2-.895-2-2V6.25c0-1.105,.895-2,2-2h6.492"
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

export default repeat2;
