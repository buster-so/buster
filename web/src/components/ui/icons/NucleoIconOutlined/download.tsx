import type { iconProps } from './iconProps';

function download(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px download';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.75,6.25h.585c.965,0,1.792,.689,1.967,1.638l1.013,5.5c.226,1.229-.717,2.362-1.967,2.362H4.652c-1.25,0-2.193-1.133-1.967-2.362l1.013-5.5c.175-.949,1.002-1.638,1.967-1.638h.585"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12 9.5L9 12.5 6 9.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 12.5L9 1.25"
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

export default download;
