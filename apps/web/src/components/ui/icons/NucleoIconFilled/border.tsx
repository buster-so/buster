import type { iconProps } from './iconProps';

function border(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px border';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.75.5H1.25c-.414,0-.75.336-.75.75v9.5c0,.414.336.75.75.75h9.5c.414,0,.75-.336.75-.75V1.25c0-.414-.336-.75-.75-.75ZM3,7c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm3,3c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm0-3c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm0-3c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm3,3c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default border;
