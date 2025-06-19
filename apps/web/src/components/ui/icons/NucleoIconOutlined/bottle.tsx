import type { iconProps } from './iconProps';

function bottle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bottle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.75 9.75L9.25 9.75 9.25 14.25 4.75 14.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 4.75L10.75 4.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,16.75h3.25c.552,0,1-.448,1-1v-5.75c0-2.812-2.5-3.25-2.5-3.25V2.25c0-.552-.448-1-1-1h-1.5c-.552,0-1,.448-1,1V6.75s-2.5,.438-2.5,3.25v5.75c0,.552,.448,1,1,1h3.25Z"
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

export default bottle;
