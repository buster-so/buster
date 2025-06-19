import type { iconProps } from './iconProps';

function bus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M.75,7.75v-2c0-.552,.448-1,1-1h1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.25,7.75v-2c0-.552-.448-1-1-1h-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.25,14.25v1.5c0,.276,.224,.5,.5,.5h.5c.276,0,.5-.224,.5-.5v-1.5h-1.5Z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25,14.25v1.5c0,.276,.224,.5,.5,.5h.5c.276,0,.5-.224,.5-.5v-1.5h-1.5Z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.25,4.5c0-2.5,2.75-2.75,5.75-2.75s5.75,.25,5.75,2.75V14.25H3.25V4.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.25 9.25L14.75 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.5 4.75L14.5 4.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.75" cy="11.75" fill="currentColor" r=".75" />
        <circle cx="12.25" cy="11.75" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default bus;
