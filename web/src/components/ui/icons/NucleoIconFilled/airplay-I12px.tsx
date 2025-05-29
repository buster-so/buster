import type { iconProps } from './iconProps';

function airplay(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px airplay';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2.5H3.75c-1.517,0-2.75,1.233-2.75,2.75v6c0,1.517,1.233,2.75,2.75,2.75h.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.5c-.689,0-1.25-.561-1.25-1.25V5.25c0-.689,.561-1.25,1.25-1.25H14.25c.689,0,1.25,.561,1.25,1.25v6c0,.689-.561,1.25-1.25,1.25h-.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.5c1.517,0,2.75-1.233,2.75-2.75V5.25c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M10.035,11.239c-.465-.688-1.605-.688-2.07,0l-2.58,3.811c-.26,.384-.286,.877-.068,1.287,.217,.41,.64,.664,1.104,.664h5.16c.464,0,.887-.254,1.104-.664,.218-.41,.191-.902-.068-1.287l-2.58-3.811Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default airplay;
