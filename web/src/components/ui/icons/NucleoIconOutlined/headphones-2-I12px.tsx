import type { iconProps } from './iconProps';

function headphones2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px headphones 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m1.25,6.75v-.75C1.25,3.377,3.377,1.25,6,1.25h0c2.623,0,4.75,2.127,4.75,4.75v.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.25,6.75h2c.552,0,1,.448,1,1v2c0,.552-.448,1-1,1h-1c-.552,0-1-.448-1-1v-3h0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m8.75,6.75h1c.552,0,1,.448,1,1v2c0,.552-.448,1-1,1h-2v-3c0-.552.448-1,1-1Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 9.25 8.75)"
        />
      </g>
    </svg>
  );
}

export default headphones2;
