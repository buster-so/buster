import type { iconProps } from './iconProps';

function window2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px window 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-7.25,2c.552,0,1,.448,1,1s-.448,1-1,1-1-.448-1-1,.448-1,1-1Zm-3,0c.552,0,1,.448,1,1s-.448,1-1,1-1-.448-1-1,.448-1,1-1ZM15.5,13.25c0,.689-.561,1.25-1.25,1.25H3.75c-.689,0-1.25-.561-1.25-1.25v-5.25H15.5v5.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default window2;
