import type { iconProps } from './iconProps';

function moonCloudDroplet(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px moon cloud droplet';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.341,7.172c.383-.469,.661-1.027,.801-1.638-.288,.066-.584,.108-.892,.108-2.209,0-4-1.791-4-4,0-.308,.042-.604,.108-.892-1.778,.406-3.108,1.991-3.108,3.892,0,.828,.252,1.598,.683,2.236"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75,14.25h-.5c-1.381,0-2.5-1.119-2.5-2.5s1.119-2.5,2.5-2.5c.413,0,.797,.11,1.14,.287,.427-1.602,1.874-2.787,3.61-2.787,1.736,0,3.182,1.186,3.61,2.787,.343-.177,.727-.287,1.14-.287,1.381,0,2.5,1.119,2.5,2.5s-1.119,2.5-2.5,2.5h-.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.585,10.499c.239-.413,.594-.752,1.02-.972"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,17.25c1.036,0,1.875-.852,1.875-1.903,0-1.445-1.051-2.063-1.875-3.097-.824,1.034-1.875,1.652-1.875,3.097,0,1.051,.839,1.903,1.875,1.903Z"
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

export default moonCloudDroplet;
