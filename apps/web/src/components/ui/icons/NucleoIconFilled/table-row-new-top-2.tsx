import type { iconProps } from './iconProps';

function tableRowNewTop2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px table row new top 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect
          height="5.5"
          width="5.5"
          fill="currentColor"
          rx="2.25"
          ry="2.25"
          strokeWidth="0"
          y="6.5"
        />
        <path
          d="m8,2h-1.25V.75c0-.414-.336-.75-.75-.75s-.75.336-.75.75v1.25h-1.25c-.414,0-.75.336-.75.75s.336.75.75.75h1.25v1.25c0,.414.336.75.75.75s.75-.336.75-.75v-1.25h1.25c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default tableRowNewTop2;
