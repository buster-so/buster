import type { iconProps } from './iconProps';

function suitcaseDollar(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase dollar';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.733,9.866c1.498-.314,2.696-.76,3.517-1.116"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,8.75c.824,.357,2.027,.806,3.532,1.119"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25,4.75V2.25c0-.552,.448-1,1-1h3.5c.552,0,1,.448,1,1v2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.264,8.22c-.321-.519-.835-.644-1.235-.644-.421,0-1.526,.224-1.423,1.285,.072,.745,.774,1.022,1.387,1.131s1.504,.343,1.526,1.241c.019,.759-.664,1.277-1.489,1.277-.684,0-1.186-.23-1.446-.744"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 7L9 7.576"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 12.511L9 13"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="10.5"
          width="14.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="4.75"
        />
      </g>
    </svg>
  );
}

export default suitcaseDollar;
