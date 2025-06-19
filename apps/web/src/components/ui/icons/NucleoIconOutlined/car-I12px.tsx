import type { iconProps } from './iconProps';

function car(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px car';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m1.189,5.311l.561-.561h8.5l.561.561c.281.281.439.663.439,1.061v2.879H.75v-2.879c0-.398.158-.779.439-1.061Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.75,4.75l.581-2.71c.099-.461.506-.79.978-.79h5.383c.472,0,.879.329.978.79l.581,2.71"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m.75,9.25h1.5v1c0,.276-.224.5-.5.5h-.5c-.276,0-.5-.224-.5-.5v-1h0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9.75,9.25h1.5v1c0,.276-.224.5-.5.5h-.5c-.276,0-.5-.224-.5-.5v-1h0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="3.25" cy="7" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="8.75" cy="7" fill="currentColor" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default car;
