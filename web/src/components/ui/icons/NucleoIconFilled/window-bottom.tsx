import type { iconProps } from './iconProps';

function windowBottom(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px window bottom';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.75,15.5H14.25c1.517,0,2.75-1.233,2.75-2.75V5.25c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v7.5c0,1.517,1.233,2.75,2.75,2.75Zm-1.25-4.75c0-.69,.56-1.25,1.25-1.25H14.25c.69,0,1.25,.56,1.25,1.25v2c0,.69-.56,1.25-1.25,1.25H3.75c-.69,0-1.25-.56-1.25-1.25v-2Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default windowBottom;
