import type { iconProps } from './iconProps';

function link2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px link 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.25 6L8.75 6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m4.75,3.5v-.156c0-.552-.448-1-1-1H1.75c-.552,0-1,.448-1,1v5.406c0,.552.448,1,1,1h2c.552,0,1-.448,1-1v-.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m7.25,3.5v-.156c0-.552.448-1,1-1h2c.552,0,1,.448,1,1v5.406c0,.552-.448,1-1,1h-2c-.552,0-1-.448-1-1v-.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default link2;
