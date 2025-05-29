import type { iconProps } from './iconProps';

function sackDollar(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sack dollar';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.264,8.72c-.321-.519-.835-.644-1.235-.644-.421,0-1.526,.224-1.423,1.285,.072,.745,.774,1.022,1.387,1.131s1.504,.343,1.526,1.241c.019,.759-.664,1.277-1.489,1.277-.684,0-1.186-.23-1.446-.744"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 7.25L9 8.076"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 13.011L9 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,4.75l2-3c0-.552-.448-1-1-1h-2.75s-2.75,0-2.75,0c-.552,0-1,.448-1,1l2,3h3.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 4.75L9 3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25,4.75c-2.391,1.281-4.25,4.516-4.25,7.25,0,3.314,2.686,4.25,6,4.25,3.314,0,6-.936,6-4.25,0-2.734-1.859-5.969-4.25-7.25"
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

export default sackDollar;
