import type { iconProps } from './iconProps';

function percentage(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px percentage';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m3.25,5.5c-1.24,0-2.25-1.009-2.25-2.25S2.01,1,3.25,1s2.25,1.009,2.25,2.25-1.01,2.25-2.25,2.25Zm0-3c-.413,0-.75.336-.75.75s.337.75.75.75.75-.336.75-.75-.337-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8.75,11c-1.24,0-2.25-1.009-2.25-2.25s1.01-2.25,2.25-2.25,2.25,1.009,2.25,2.25-1.01,2.25-2.25,2.25Zm0-3c-.413,0-.75.336-.75.75s.337.75.75.75.75-.336.75-.75-.337-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m3.109,11c-.145,0-.292-.042-.421-.13-.343-.233-.432-.699-.198-1.042L8.27,1.328c.231-.342.698-.433,1.042-.198.343.233.432.699.198,1.042L3.73,10.672c-.145.213-.381.328-.621.328Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default percentage;
