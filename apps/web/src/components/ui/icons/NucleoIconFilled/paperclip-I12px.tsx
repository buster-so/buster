import type { iconProps } from './iconProps';

function paperclip(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px paperclip';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.75,4.25c-.414,0-.75,.336-.75,.75v6.75c0,2.068-1.682,3.75-3.75,3.75s-3.75-1.682-3.75-3.75V4.75c0-1.241,1.009-2.25,2.25-2.25s2.25,1.009,2.25,2.25v7c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v6.75c0,1.241,1.009,2.25,2.25,2.25s2.25-1.009,2.25-2.25V4.75c0-2.068-1.682-3.75-3.75-3.75s-3.75,1.682-3.75,3.75v7c0,2.895,2.355,5.25,5.25,5.25s5.25-2.355,5.25-5.25V5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default paperclip;
