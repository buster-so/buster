import type { iconProps } from './iconProps';

function arrowBoldRightFromLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold right from line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.561,13.854l5.605-4.463c.251-.2,.251-.582,0-.782l-5.605-4.463c-.328-.261-.811-.028-.811,.391v2.213H5.75c-.552,0-1,.448-1,1v2.5c0,.552,.448,1,1,1h4v2.213c0,.419,.484,.652,.811,.391Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 11.25L1.75 6.75"
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

export default arrowBoldRightFromLine;
