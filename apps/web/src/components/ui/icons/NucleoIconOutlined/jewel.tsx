import type { iconProps } from './iconProps';

function jewel(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px jewel';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.25 6.545L2.269 4.925"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.545 5.247L4.925 2.269"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.455 5.25L13.075 2.269"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.753 6.545L15.731 4.925"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 11.455L15.731 13.075"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.455 12.753L13.075 15.731"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.545 12.75L4.925 15.731"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.247 11.455L2.269 13.075"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.545 12.75L5.25 11.455 5.25 6.545 6.545 5.25 11.455 5.25 12.75 6.545 12.75 11.455 11.455 12.75 6.545 12.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.412,15.457l-1.869-1.869c-.188-.188-.293-.442-.293-.707V5.119c0-.265,.105-.52,.293-.707l1.869-1.869c.188-.188,.442-.293,.707-.293h7.762c.265,0,.52,.105,.707,.293l1.869,1.869c.188,.188,.293,.442,.293,.707v7.762c0,.265-.105,.52-.293,.707l-1.869,1.869c-.188,.188-.442,.293-.707,.293H5.119c-.265,0-.52-.105-.707-.293Z"
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

export default jewel;
