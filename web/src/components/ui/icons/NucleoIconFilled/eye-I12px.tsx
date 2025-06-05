import type { iconProps } from './iconProps';

function eye(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px eye';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m16.5386,7.4556c-1.0962-1.6641-3.5332-4.4561-7.5386-4.4561-4.001,0-6.4404,2.791-7.5386,4.4551-.6182.9395-.6182,2.1514,0,3.0898,1.0962,1.6641,3.5332,4.4561,7.5386,4.4561,4.001,0,6.4404-2.791,7.5386-4.4551.6182-.9395.6182-2.1514,0-3.0898Zm-7.5386,4.5449c-1.6543,0-3-1.3457-3-3s1.3457-3,3-3,3,1.3457,3,3-1.3457,3-3,3Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default eye;
