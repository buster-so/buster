import type { iconProps } from './iconProps';

function constructionSign(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px construction sign';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.25,4.5c-.414,0-.75-.336-.75-.75v-1c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,4.5c-.414,0-.75-.336-.75-.75v-1c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M6,14.5h-1v-4.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v4.25h-1c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.5,14.5h-1v-4.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v4.25h-1c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,3H2.75c-.965,0-1.75,.785-1.75,1.75v4.5c0,.965,.785,1.75,1.75,1.75H15.25c.965,0,1.75-.785,1.75-1.75V4.75c0-.965-.785-1.75-1.75-1.75Zm.25,1.75v3.689l-3.939-3.939h3.689c.138,0,.25,.112,.25,.25Zm-12.75-.25h3.689l5,5H7.061L2.5,4.939v-.189c0-.138,.112-.25,.25-.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default constructionSign;
