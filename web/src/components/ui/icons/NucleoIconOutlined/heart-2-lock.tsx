import type { iconProps } from './iconProps';

function heart2Lock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart 2 lock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="3.5"
          width="6"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="10.25"
          y="13.75"
        />
        <path
          d="M15.448,8.926c.703-.909,.995-2.127,.668-3.37-.181-.688-.575-1.32-1.11-1.79-2.005-1.758-4.933-1.05-6.007,1.162-.171-.353-.396-.677-.666-.962-1.452-1.528-3.867-1.591-5.395-.139-1.528,1.451-1.591,3.867-.139,5.395l4.974,5.168"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75,13.75v-1.5c0-.828,.672-1.5,1.5-1.5h0c.828,0,1.5,.672,1.5,1.5v1.5"
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

export default heart2Lock;
