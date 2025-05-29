import type { iconProps } from './iconProps';

function engine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px engine';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.25,8c-.414,0-.75,.336-.75,.75v1.5h-2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.25v1.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-4.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,7h-1.125l-.975-1.3c-.329-.438-.852-.7-1.4-.7H5.75c-.548,0-1.071,.262-1.4,.7l-.975,1.3h-.625c-.965,0-1.75,.785-1.75,1.75v2.5c0,.965,.785,1.75,1.75,1.75h.625l.975,1.3c.329,.438,.852,.7,1.4,.7h7.5c.965,0,1.75-.785,1.75-1.75v-4.5c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
        <path
          d="M10.25,1H5.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default engine;
