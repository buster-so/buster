import type { iconProps } from './iconProps';

function heart2Minus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart 2 minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.2,9.222c.882-.929,1.279-2.284,.916-3.667-.181-.688-.575-1.32-1.11-1.79-2.005-1.758-4.933-1.05-6.007,1.162-.171-.353-.396-.677-.666-.962-1.451-1.528-3.867-1.591-5.395-.139-1.528,1.451-1.59,3.867-.139,5.395l5.48,5.694c.393,.409,1.048,.409,1.441,0l.909-.944"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.75 11.75L11.75 11.75"
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

export default heart2Minus;
