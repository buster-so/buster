import type { iconProps } from './iconProps';

function codeBranch(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px code branch';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,5c-.414,0-.75,.336-.75,.75v1c0,.689-.561,1.25-1.25,1.25H6.75c-.452,0-.873,.12-1.25,.314v-2.564c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v6.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.5c0-.689,.561-1.25,1.25-1.25h4.5c1.517,0,2.75-1.233,2.75-2.75v-1c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <circle cx="4.75" cy="3.75" fill="currentColor" r="2.5" />
        <circle cx="13.25" cy="3.75" fill="currentColor" r="2.5" />
        <circle cx="4.75" cy="14.25" fill="currentColor" r="2.5" />
      </g>
    </svg>
  );
}

export default codeBranch;
