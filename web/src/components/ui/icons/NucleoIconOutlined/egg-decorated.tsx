import type { iconProps } from './iconProps';

function eggDecorated(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px egg decorated';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.214 10.318L6.422 8.341 9 10.318 11.578 8.341 14.786 10.318"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.2,10.977C3.2,5.705,5.778,1.75,9,1.75c3.195,0,5.8,3.955,5.8,9.227,0,3.295-2.953,5.273-5.8,5.273s-5.8-1.977-5.8-5.273Z"
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

export default eggDecorated;
