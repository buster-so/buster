import type { iconProps } from './iconProps';

function strokeProjectingCap(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stroke projecting cap';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,15H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.138,0,.25-.112,.25-.25V4.75c0-.138-.112-.25-.25-.25H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.965,0,1.75,.785,1.75,1.75V13.25c0,.965-.785,1.75-1.75,1.75Z"
          fill="currentColor"
        />
        <path
          d="M11,6c-1.394,0-2.558,.96-2.893,2.25H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6.357c.335,1.29,1.5,2.25,2.893,2.25,1.654,0,3-1.346,3-3s-1.346-3-3-3Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default strokeProjectingCap;
