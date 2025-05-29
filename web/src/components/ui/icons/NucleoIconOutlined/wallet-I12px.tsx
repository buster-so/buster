import type { iconProps } from './iconProps';

function wallet(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px wallet';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m.75,2.25h0c0-.828.672-1.5,1.5-1.5h5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.25,3.75H2.25c-.828,0-1.5-.672-1.5-1.5v6c0,1.105.895,2,2,2h7.5c.552,0,1-.448,1-1v-4.5c0-.552-.448-1-1-1Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="8" cy="7" fill="currentColor" r="1" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default wallet;
