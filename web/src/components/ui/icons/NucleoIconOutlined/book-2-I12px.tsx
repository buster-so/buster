import type { iconProps } from './iconProps';

function book2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px book 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m1.75,9.75h0c0,.828.672,1.5,1.5,1.5h7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.75,9.75V2.25c0-.828.672-1.5,1.5-1.5h5.5c.828,0,1.5.672,1.5,1.5v6H3.25c-.828,0-1.5.672-1.5,1.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 4.25L4.75 4.25"
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

export default book2;
