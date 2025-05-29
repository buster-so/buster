import type { iconProps } from './iconProps';

function addItem(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px add item';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.25,2.5h-1.75V.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M14.75,8c-.414,0-.75,.336-.75,.75v2.75H3V5.25c0-.689,.561-1.25,1.25-1.25h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H4.25c-1.517,0-2.75,1.233-2.75,2.75V13.75c0,1.517,1.233,2.75,2.75,2.75H12.75c1.517,0,2.75-1.233,2.75-2.75v-5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default addItem;
