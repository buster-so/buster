import type { iconProps } from './iconProps';

function watch2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px watch 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12,2.5H6c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12,17H6c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12.25,3.5H5.75c-1.517,0-2.75,1.233-2.75,2.75v5.5c0,1.517,1.233,2.75,2.75,2.75h6.5c1.517,0,2.75-1.233,2.75-2.75V6.25c0-1.517-1.233-2.75-2.75-2.75Zm-.376,7.416c-.145,.217-.382,.334-.625,.334-.143,0-.288-.041-.416-.126l-2.25-1.5c-.208-.139-.334-.373-.334-.624v-2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.849l1.916,1.277c.345,.23,.438,.695,.208,1.04Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default watch2;
