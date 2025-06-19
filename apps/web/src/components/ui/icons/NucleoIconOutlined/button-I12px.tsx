import type { iconProps } from './iconProps';

function button(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px button';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m5.031,5.39l4.891,1.787c.447.163.434.801-.019.946l-2.106.674-.674,2.106c-.145.454-.782.467-.946.019l-1.787-4.891c-.146-.399.242-.787.641-.641Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m11.25,5.052v-1.302c0-1.105-.895-2-2-2H2.75C1.645,1.75.75,2.645.75,3.75v1.5c0,.889.583,1.633,1.385,1.894"
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

export default button;
