import type { iconProps } from './iconProps';

function paperclipMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px paperclip minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,3.5h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M11.75,7c-.414,0-.75,.336-.75,.75v4c0,2.068-1.683,3.75-3.75,3.75s-3.75-1.682-3.75-3.75V4.75c0-1.241,1.01-2.25,2.25-2.25s2.25,1.009,2.25,2.25v7c0,.414-.337,.75-.75,.75s-.75-.336-.75-.75V5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v6.75c0,1.241,1.01,2.25,2.25,2.25s2.25-1.009,2.25-2.25V4.75c0-2.068-1.683-3.75-3.75-3.75s-3.75,1.682-3.75,3.75v7c0,2.895,2.355,5.25,5.25,5.25s5.25-2.355,5.25-5.25V7.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default paperclipMinus;
