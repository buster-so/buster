import type { iconProps } from './iconProps';

function bottleWine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bottle wine';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,7.016c-.42-.208-.75-.266-.75-.266V2.25c0-.552-.448-1-1-1h-1c-.552,0-1,.448-1,1V6.75s-2.5,.438-2.5,3.25v5.75c0,.552,.448,1,1,1h5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75 9.75L7.25 9.75 7.25 14.25 2.75 14.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25 4.75L8.25 4.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,8.75h4l.412,2.058c.304,1.522-.912,2.942-2.412,2.942s-2.716-1.42-2.412-2.942l.412-2.058Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 16.75L14.25 16.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 16.75L12.75 13.75"
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

export default bottleWine;
