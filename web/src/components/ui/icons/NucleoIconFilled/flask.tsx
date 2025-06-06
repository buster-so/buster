import type { iconProps } from './iconProps';

function flask(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px flask';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.837,9.279l-2.837-4.257V1h-4v4.023l-2.837,4.257c-.359.538-.392,1.226-.087,1.796.305.57.896.924,1.543.924h6.763c.647,0,1.238-.354,1.543-.924.305-.57.271-1.259-.087-1.796Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8.75,1.5H3.25c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h5.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default flask;
