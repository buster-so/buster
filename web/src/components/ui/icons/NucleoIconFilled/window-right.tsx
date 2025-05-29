import type { iconProps } from './iconProps';

function windowRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px window right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2.5H3.75c-1.517,0-2.75,1.233-2.75,2.75v7.5c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V5.25c0-1.517-1.233-2.75-2.75-2.75Zm1.25,10.25c0,.69-.56,1.25-1.25,1.25h-2c-.69,0-1.25-.56-1.25-1.25V5.25c0-.69,.56-1.25,1.25-1.25h2c.69,0,1.25,.56,1.25,1.25v7.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default windowRight;
