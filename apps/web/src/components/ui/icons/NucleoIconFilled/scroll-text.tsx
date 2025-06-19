import type { iconProps } from './iconProps';

function scrollText(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px scroll text';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.75,12h-.75V3.75c0-1.241-1.009-2.25-2.25-2.25H3.25c-1.241,0-2.25,1.009-2.25,2.25v2c0,.965,.785,1.75,1.75,1.75h1.25v6.75c0,1.241,1.009,2.25,2.25,2.25H14.75c1.241,0,2.25-1.009,2.25-2.25v-1c0-.689-.561-1.25-1.25-1.25ZM4,6h-1.25c-.138,0-.25-.112-.25-.25V3.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.25Zm3.5-1h4c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H7.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75Zm-.75,3.75c0-.414,.336-.75,.75-.75h4c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H7.5c-.414,0-.75-.336-.75-.75Zm8.75,5.5c0,.414-.336,.75-.75,.75h-6.388c.084-.236,.138-.486,.138-.75v-.75h7v.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default scrollText;
