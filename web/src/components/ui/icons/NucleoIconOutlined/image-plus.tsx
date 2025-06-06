import type { iconProps } from './iconProps';

function imagePlus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px image plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m3.762,14.989l6.074-6.075c.781-.781,2.047-.781,2.828,0l2.586,2.586"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25 1.25L14.25 6.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9.461,2.75h-4.711c-1.1046,0-2,.8955-2,2v8.5c0,1.1045.8954,2,2,2h8.5c1.1046,0,2-.8955,2-2v-4.7109"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.75 3.75L11.75 3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6.25" cy="7.25" fill="currentColor" r="1.25" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default imagePlus;
