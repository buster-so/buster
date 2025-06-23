import type { iconProps } from './iconProps';

function paragraphAdd(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px paragraph add';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,12h-2.25v-2.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.25h-2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.25v2.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.25h2.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M6.25,14.5H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M6.25,11H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,7.5H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,4H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default paragraphAdd;
