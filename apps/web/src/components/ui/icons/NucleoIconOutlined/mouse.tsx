import type { iconProps } from './iconProps';

function mouse(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px mouse';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m8.25,10.75c0-2.209,1.791-4,4-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m5.25,8.5c.4142,0,.75-.3358.75-.75s-.3358-.75-.75-.75-.75.3358-.75.75.3358.75.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m12.75,16.75h-1.5c-.8284,0-1.5-.6716-1.5-1.5h0c0-.8284.6716-1.5,1.5-1.5h4c.8284,0,1.5-.6716,1.5-1.5h0c0-.8284-.6716-1.5-1.5-1.5h-1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m14.84,5.018c-1.811-2.171-5.16-2.272-7.965-1.046-.849-1.247-2.193-1.472-2.193-1.472l-.555,3.327c-1.182,1.15-1.988,2.489-2.436,3.551-.275.653.221,1.372.93,1.372h12.309c.483,0,.901-.341.985-.816.255-1.435.323-3.239-1.076-4.916h.001Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m7.437,5.266c-.117-.525-.327-.947-.562-1.294"
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

export default mouse;
