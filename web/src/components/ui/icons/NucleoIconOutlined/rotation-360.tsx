import type { iconProps } from './iconProps';

function rotation360(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px rotation 360';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.5025,16.0509c-.4686.2906-.9744.4491-1.5025.4491-2.428,0-4.397-3.358-4.397-7.5S6.572,1.5,9,1.5s4.397,3.358,4.397,7.5c0,1.384-.22,2.681-.603,3.793"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m8.5735,4.6109c.1413-.0046.2836-.0069.4265-.0069,4.142,0,7.5,1.968,7.5,4.397s-3.358,4.397-7.5,4.397-7.5-1.97-7.5-4.398c0-1.617,1.489-3.03,3.707-3.794"
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

export default rotation360;
