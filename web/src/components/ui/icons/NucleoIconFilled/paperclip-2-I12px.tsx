import type { iconProps } from './iconProps';

function paperclip2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px paperclip 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.758,9.134c-.293-.293-.768-.293-1.061,0l-4.773,4.773c-1.416,1.416-3.887,1.416-5.303,0-.708-.708-1.099-1.65-1.099-2.652s.391-1.943,1.099-2.651L9.57,3.654c.876-.876,2.305-.877,3.183,0,.877,.877,.877,2.305,0,3.182l-4.95,4.95c-.293,.292-.768,.292-1.061,0-.292-.292-.292-.769,0-1.061l4.772-4.773c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-4.772,4.773c-.425,.425-.659,.99-.659,1.591s.234,1.167,.659,1.591c.878,.877,2.306,.877,3.182,0l4.95-4.95c1.461-1.462,1.461-3.841,0-5.303-1.417-1.418-3.889-1.416-5.304,0L3.561,7.543c-.992,.991-1.538,2.31-1.538,3.712s.546,2.721,1.538,3.712c.991,.992,2.31,1.538,3.712,1.538s2.721-.546,3.712-1.538l4.773-4.773c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default paperclip2;
