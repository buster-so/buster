import type { iconProps } from './iconProps';

function xmasDecorations(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px xmas decorations';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,6.5c-.414,0-.75-.336-.75-.75V1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V5.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.75,6.75c-.414,0-.75-.336-.75-.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M2.25,6.75c-.414,0-.75-.336-.75-.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,8.25c.861,0,1.654,.278,2.307,.741,.117-.132,.193-.301,.193-.491v-1.75c0-.965-.785-1.75-1.75-1.75h-1.5c-.965,0-1.75,.785-1.75,1.75v1.75c0,.19,.077,.359,.193,.491,.653-.463,1.445-.741,2.307-.741Z"
          fill="currentColor"
        />
        <path
          d="M9,7.5c-2.619,0-4.75,2.131-4.75,4.75s2.131,4.75,4.75,4.75,4.75-2.131,4.75-4.75-2.131-4.75-4.75-4.75Zm0,1.5c1.533,0,2.813,1.07,3.154,2.5H5.846c.341-1.43,1.621-2.5,3.154-2.5Zm0,6.5c-1.533,0-2.813-1.07-3.154-2.5h6.308c-.341,1.43-1.621,2.5-3.154,2.5Z"
          fill="currentColor"
        />
        <circle cx="15.75" cy="7.5" fill="currentColor" r="2.25" />
        <circle cx="2.25" cy="7.5" fill="currentColor" r="2.25" />
      </g>
    </svg>
  );
}

export default xmasDecorations;
