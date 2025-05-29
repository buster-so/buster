import type { iconProps } from './iconProps';

function passport(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px passport';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.75,1H5.25c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75h7.5c1.517,0,2.75-1.233,2.75-2.75V3.75c0-1.517-1.233-2.75-2.75-2.75Zm-3.75,4.5c1.105,0,2,.896,2,2s-.895,2-2,2-2-.896-2-2,.895-2,2-2Zm2,7.5H7c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h4c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default passport;
