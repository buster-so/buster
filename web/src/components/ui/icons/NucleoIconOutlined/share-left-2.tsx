import type { iconProps } from './iconProps';

function shareLeft2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px share left 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.25,4.5V1.75L1.75,6l4.5,4.25v-2.75c3.625,0,6,3.5,6,3.5,0,0,0-6.5-6-6.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,2.75h2.5c1.105,0,2,.895,2,2V13.25c0,1.105-.895,2-2,2H4.75c-1.105,0-2-.895-2-2v-2.5"
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

export default shareLeft2;
