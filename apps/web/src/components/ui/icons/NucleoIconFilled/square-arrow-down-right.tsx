import type { iconProps } from './iconProps';

function squareArrowDownRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square arrow down right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-.75,9.75c0,.414-.336,.75-.75,.75h-3.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.689L5.72,6.78c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l4.22,4.22v-1.689c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareArrowDownRight;
