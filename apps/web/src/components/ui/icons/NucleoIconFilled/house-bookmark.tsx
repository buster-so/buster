import type { iconProps } from './iconProps';

function houseBookmark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house bookmark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.5,11.75c0-1.792,1.458-3.25,3.25-3.25h2.25v-1.504c0-.543-.258-1.064-.691-1.394L10.059,1.613c-.624-.475-1.495-.474-2.118,0L2.691,5.603s0,0,0,0c-.433,.329-.691,.85-.691,1.393v7.254c0,1.517,1.233,2.75,2.75,2.75h5.75v-5.25Z"
          fill="currentColor"
        />
        <path
          d="M16.25,10h-2.5c-.965,0-1.75,.785-1.75,1.75v5.5c0,.303,.183,.577,.463,.693,.28,.116,.602,.053,.817-.163l1.72-1.72,1.72,1.72c.144,.144,.335,.22,.53,.22,.097,0,.194-.019,.287-.057,.28-.116,.463-.39,.463-.693v-5.5c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default houseBookmark;
