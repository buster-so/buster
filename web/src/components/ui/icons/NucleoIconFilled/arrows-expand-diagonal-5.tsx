import type { iconProps } from './iconProps';

function arrowsExpandDiagonal5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrows expand diagonal 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M0.868 8.25H17.131V9.75H0.868z" fill="currentColor" transform="rotate(-45 9 9)" />
        <path
          d="M14.75,10.01c-.414,0-.75-.336-.75-.75V4h-5.26c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6.01c.414,0,.75,.336,.75,.75v6.01c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9.26,15.5H3.25c-.414,0-.75-.336-.75-.75v-6.01c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v5.26h5.26c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowsExpandDiagonal5;
