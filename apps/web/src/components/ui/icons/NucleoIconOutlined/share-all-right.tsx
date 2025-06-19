import type { iconProps } from './iconProps';

function shareAllRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px share all right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.75,6.776V3.543s5.5,4.885,5.5,4.885l-5.5,5.029v-3.233c-4.526,0-7,3.233-7,3.233,0,0,.103-6.681,7-6.681Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75 3.543L17.25 8.428 11.75 13.457"
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

export default shareAllRight;
