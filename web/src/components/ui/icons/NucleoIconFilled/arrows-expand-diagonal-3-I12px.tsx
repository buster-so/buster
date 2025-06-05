import type { iconProps } from './iconProps';

function arrowsExpandDiagonal3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrows expand diagonal 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M0.161 8.25H17.839000000000002V9.75H0.161z"
          fill="currentColor"
          transform="rotate(-45 9 9)"
        />
        <path
          d="M15.25,8c-.414,0-.75-.336-.75-.75V3.5h-3.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h4.5c.414,0,.75,.336,.75,.75V7.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M7.25,16H2.75c-.414,0-.75-.336-.75-.75v-4.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.75h3.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowsExpandDiagonal3;
