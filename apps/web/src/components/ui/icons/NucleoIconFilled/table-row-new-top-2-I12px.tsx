import type { iconProps } from './iconProps';

function tableRowNewTop2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table row new top 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.5,5h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1.75V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <rect height="6" width="16" fill="currentColor" rx="2.25" ry="2.25" x="1" y="9" />
      </g>
    </svg>
  );
}

export default tableRowNewTop2;
