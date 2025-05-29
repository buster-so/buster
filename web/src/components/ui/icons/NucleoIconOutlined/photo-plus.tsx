import type { iconProps } from './iconProps';

function photoPlus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px photo plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m4,14.75l5.836-5.836c.781-.781,2.047-.781,2.828,0l3.586,3.586"
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
          d="m9.3004,3.25H3.75c-1.1046,0-2,.8955-2,2v7.5c0,1.1045.8954,2,2,2h10.5c1.1046,0,2-.8955,2-2v-5.0137"
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
        <circle cx="5.75" cy="7.25" fill="currentColor" r="1.25" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default photoPlus;
