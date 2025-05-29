import type { iconProps } from './iconProps';

function crosshairs4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px crosshairs 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,8.25h-.538c-.353-3.538-3.174-6.359-6.712-6.712v-.538c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v.538c-3.538,.353-6.359,3.174-6.712,6.712h-.538c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.538c.353,3.538,3.174,6.359,6.712,6.712v.538c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.538c3.538-.353,6.359-3.174,6.712-6.712h.538c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Zm-5.5,1.5h-1.75v1.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.75h-1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.75v-1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.75h1.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default crosshairs4;
