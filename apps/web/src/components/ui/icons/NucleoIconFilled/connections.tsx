import type { iconProps } from './iconProps';

function connections(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px connections';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,4.939l2.875-2.875-1.464-1.463c-.754-.754-2.068-.754-2.822,0l-1.464,1.463,2.875,2.875Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m2.064,8.875l2.875-2.875-2.875-2.875-1.464,1.463c-.777.778-.777,2.045,0,2.823l1.464,1.463Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6,7.061l-2.875,2.875,1.464,1.463c.377.377.878.585,1.411.585s1.034-.208,1.411-.585l1.464-1.463-2.875-2.875Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.936,3.125l-2.875,2.875,2.875,2.875,1.464-1.463c.777-.778.777-2.045,0-2.823l-1.464-1.463Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default connections;
