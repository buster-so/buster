import type { iconProps } from './iconProps';

function creditCardPlus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px credit card plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,5.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v.75H17v-.75Z"
          fill="currentColor"
        />
        <path
          d="M9,14.25c0-1.241,1.009-2.25,2.25-2.25h.25v-.25c0-1.241,1.009-2.25,2.25-2.25s2.25,1.009,2.25,2.25v.25h.25c.264,0,.514,.054,.75,.138v-4.138H1v4.25c0,1.517,1.233,2.75,2.75,2.75h5.388c-.084-.236-.138-.486-.138-.75Zm-1.75-2.25h-3c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,13.5h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default creditCardPlus;
