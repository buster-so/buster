import type { iconProps } from './iconProps';

function dietApple(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px diet apple';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.923,14.638c1.448,1.095,2.792,.385,3.634,.385,1.081,0,2.992,1.174,4.886-1.817,1.973-3.114,1.489-6.639,.021-7.801-1.595-1.267-3.391-.223-4.909-.223s-3.131-1.107-4.909,.223c-.137,.102-.264,.217-.382,.342"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12,.25h0c.276,0,.5,.224,.5,.5h0c0,1.38-1.12,2.5-2.5,2.5h0c-.276,0-.5-.224-.5-.5h0c0-1.38,1.12-2.5,2.5-2.5Z"
          fill="currentColor"
        />
        <path
          d="M8.75 8.25L8.75 9.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25 8.25L6.25 9.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75 8.25L3.75 9.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="4"
          width="10"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.25"
          y="8.25"
        />
      </g>
    </svg>
  );
}

export default dietApple;
