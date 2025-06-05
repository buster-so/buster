import type { iconProps } from './iconProps';

function connection(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px connection';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13,15.047c1.958-1.298,3.25-3.522,3.25-6.047,0-4.004-3.246-7.25-7.25-7.25S1.75,4.996,1.75,9s3.246,7.25,7.25,7.25v-3.146"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.043,7.75h5.914c.552,0,1,.448,1,1v.396c0,2.185-1.772,3.957-3.957,3.957h0c-2.185,0-3.957-1.772-3.957-3.957v-.396c0-.552,.448-1,1-1Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.232 7.75L7.232 5.55"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.768 7.75L10.768 5.55"
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

export default connection;
