import type { iconProps } from './iconProps';

function dice6(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dice 6';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75ZM6.5,13.25c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm0-3.25c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm0-3.25c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm5,6.5c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm0-3.25c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm0-3.25c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default dice6;
