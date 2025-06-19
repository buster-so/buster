import type { iconProps } from './iconProps';

function paintbrush(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px paintbrush';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.44.542c-.723-.723-1.984-.723-2.707,0l-3.283,3.285c.609.236,1.173.59,1.652,1.068.479.48.828,1.037,1.061,1.629l3.277-3.275c.746-.747.746-1.961,0-2.707Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6.043,5.957c-1.245-1.243-3.234-1.277-4.438-.075C-.007,7.494-.006,10.879,0,11.26c.006.404.331.731.735.739.027,0,.07,0,.128,0,.73,0,3.744-.095,5.255-1.606,1.202-1.202,1.169-3.193-.075-4.438Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default paintbrush;
