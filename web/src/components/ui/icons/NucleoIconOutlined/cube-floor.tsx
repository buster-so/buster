import type { iconProps } from './iconProps';

function cubeFloor(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cube floor';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m8.157,1.977l-3.57,2.071c-.518.301-.837.854-.837,1.453v4.155c0,.599.319,1.153.837,1.453l3.57,2.071c.521.302,1.165.302,1.686,0l3.57-2.071c.518-.301.837-.854.837-1.453v-4.155c0-.599-.319-1.153-.837-1.453l-3.57-2.071c-.521-.302-1.165-.302-1.686,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.026 4.663L9 7.578 3.974 4.663"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 13.406L9 7.578"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m15.4562,13.3391c.5075.2732.7938.583.7938.9109,0,1.105-3.246,2-7.25,2s-7.25-.895-7.25-2c0-.3278.2862-.6375.7935-.9107"
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

export default cubeFloor;
