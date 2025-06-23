import type { iconProps } from './iconProps';

function stadium(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stadium';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.75,15.695v-2.945c0-.276,.224-.5,.5-.5h1.5c.276,0,.5,.224,.5,.5v2.945"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.851,5.5c.826-.371,2.271-.75,4.149-.75s3.323,.379,4.149,.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.28,11.754c-1.645-.484-2.786-1.279-2.996-2.197"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.72,11.754c1.645-.484,2.786-1.279,2.996-2.197"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.236,5.705l-.986,7.295c-.209,1.547-2.798,2.75-6.25,2.75-3.452,0-6.041-1.203-6.25-2.75l-.986-7.295"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <ellipse
          cx="9"
          cy="5.5"
          fill="none"
          rx="7.25"
          ry="3.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default stadium;
