import type { iconProps } from './iconProps';

function rectLogin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px rect login';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.75,5.75v-1.5c0-1.105,.895-2,2-2h5.5c1.105,0,2,.895,2,2V13.75c0,1.105-.895,2-2,2H6.75c-1.105,0-2-.895-2-2v-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.5 11.75L10.25 9 7.5 6.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.25 9L1.75 9"
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

export default rectLogin;
