import type { iconProps } from './iconProps';

function fill(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px fill';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.375,16.75c1.036,0,1.875-.852,1.875-1.903,0-1.445-1.051-2.063-1.875-3.097-.824,1.034-1.875,1.652-1.875,3.097,0,1.051,.839,1.903,1.875,1.903Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.82 8.75L13.671 8.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.023,.749l6.867,8.168-5.886,4.946c-.854,.717-2.129,.598-2.835-.265l-2.967-3.595c-.699-.855-.573-2.115,.283-2.814L8.375,2.375"
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

export default fill;
