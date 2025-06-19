import type { iconProps } from './iconProps';

function sparkle2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px sparkle 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.5 10.25L7.845 6.846 11.25 5.5 7.845 4.154 6.5 0.75 5.154 4.154 1.75 5.5 5.154 6.846 6.5 10.25z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m3.492,10.508l-.946.315-.316.947c-.102.306-.609.306-.711,0l-.316-.947-.946-.315c-.153-.051-.257-.194-.257-.356s.104-.305.257-.356l.946-.315.316-.947c.051-.153.194-.256.355-.256s.305.104.355.256l.316.947.946.315c.153.051.257.194.257.356s-.104.305-.257.356h0Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default sparkle2;
