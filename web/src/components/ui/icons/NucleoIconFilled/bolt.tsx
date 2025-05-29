import type { iconProps } from './iconProps';

function bolt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px bolt';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.672,4.917c-.126-.256-.387-.417-.672-.417h-3.146l.474-3.654c.043-.336-.145-.661-.459-.79s-.676-.032-.881.238L1.404,6.295c-.174.227-.203.532-.076.788.126.256.387.417.672.417h3.146l-.474,3.654c-.043.336.145.661.459.79.093.038.189.057.285.057.229,0,.451-.104.596-.295l4.583-6c.174-.227.203-.532.076-.788Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default bolt;
