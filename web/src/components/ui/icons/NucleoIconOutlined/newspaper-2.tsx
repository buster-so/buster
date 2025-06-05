import type { iconProps } from './iconProps';

function newspaper2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px newspaper 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m3.25,14.75h11.5c.8284,0,1.5-.6716,1.5-1.5V3.25H4.75v10c0,.8284-.6716,1.5-1.5,1.5h0c-.8284,0-1.5-.6716-1.5-1.5v-7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 7.25L13.25 7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 10.25L13.25 10.25"
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

export default newspaper2;
