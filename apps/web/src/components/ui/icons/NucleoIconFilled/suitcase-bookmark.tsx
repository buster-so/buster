import type { iconProps } from './iconProps';

function suitcaseBookmark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase bookmark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,5.5c-.414,0-.75-.336-.75-.75V2.25c0-.138-.112-.25-.25-.25h-3.5c-.138,0-.25,.112-.25,.25v2.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2.25c0-.965,.785-1.75,1.75-1.75h3.5c.965,0,1.75,.785,1.75,1.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M10.5,11.75c0-1.792,1.458-3.25,3.25-3.25h2.5c.259,0,.508,.038,.75,.096v-1.846c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h6.75v-4.25Z"
          fill="currentColor"
        />
        <path
          d="M16.25,10h-2.5c-.965,0-1.75,.785-1.75,1.75v5.5c0,.303,.183,.577,.463,.693s.603,.052,.817-.163l1.72-1.72,1.72,1.72c.144,.144,.335,.22,.53,.22,.097,0,.194-.019,.287-.057,.28-.116,.463-.39,.463-.693v-5.5c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default suitcaseBookmark;
