import type { iconProps } from './iconProps';

function nut(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px nut';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.695,4.862l-1.865-3.23c-.404-.698-1.155-1.132-1.959-1.132h-3.742c-.804,0-1.555.434-1.959,1.133L.305,4.862c-.405.702-.405,1.574,0,2.275l1.865,3.23c.404.698,1.155,1.132,1.959,1.132h3.742c.804,0,1.555-.434,1.959-1.133l1.865-3.229c.405-.702.405-1.574,0-2.275Zm-5.695,3.138c-1.105,0-2-.895-2-2s.895-2,2-2,2,.895,2,2-.895,2-2,2Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default nut;
