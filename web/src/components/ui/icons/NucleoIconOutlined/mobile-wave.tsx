import type { iconProps } from './iconProps';

function mobileWave(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px mobile wave';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.25,11.25v3c0,1.105-.895,2-2,2H5.75c-1.105,0-2-.895-2-2v-2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,6.75V3.75c0-1.105,.895-2,2-2h6.5c1.105,0,2,.895,2,2v2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1,9.25H5.25c.552,0,1-.448,1-1v-1.625c0-.759,.616-1.375,1.375-1.375h0c.759,0,1.375,.616,1.375,1.375v4.75c0,.759,.616,1.375,1.375,1.375h0c.759,0,1.375-.616,1.375-1.375v-1.625c0-.552,.448-1,1-1h4.25"
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

export default mobileWave;
