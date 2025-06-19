import type { iconProps } from './iconProps';

function candle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px candle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.485,.179c-.279-.238-.691-.238-.971,0-.206,.175-2.015,1.758-2.015,3.359,0,1.358,1.121,2.462,2.5,2.462s2.5-1.104,2.5-2.462c0-1.601-1.809-3.184-2.015-3.359Z"
          fill="currentColor"
        />
        <path
          d="M10.25,7h-.25v3.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-3.75h-.75c-.965,0-1.75,.785-1.75,1.75v6.5c0,.414,.336,.75,.75,.75h4.5c.414,0,.75-.336,.75-.75v-6.5c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
        <path
          d="M15,16.5H3c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default candle;
