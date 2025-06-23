import type { iconProps } from './iconProps';

function pins2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pins 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.75,8.325c0,2.155-2.817,5.616-4.113,7.094-.339,.387-.936,.387-1.275,0-1.295-1.477-4.113-4.938-4.113-7.094,0-2.869,2.455-4.534,4.75-4.534s4.75,1.665,4.75,4.534Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.756,8.569c-.581-.982-1.006-1.971-1.006-2.763,0-2.567,2.196-4.057,4.25-4.057,.359,0,.722,.046,1.078,.134"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.244,8.569c.581-.982,1.006-1.971,1.006-2.763,0-2.567-2.196-4.057-4.25-4.057-.359,0-.722,.046-1.078,.134"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="8.75"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default pins2;
