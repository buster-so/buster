import type { iconProps } from './iconProps';

function wrenchScrewdriver(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px wrench screwdriver';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,5.5c0-1.537-.927-2.854-2.25-3.433v3.683H3.75V2.067c-1.323,.579-2.25,1.896-2.25,3.433s.927,2.854,2.25,3.433v6.317c0,.552,.448,1,1,1h1c.552,0,1-.448,1-1v-6.317c1.323-.579,2.25-1.896,2.25-3.433Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,9.25v6c0,.552-.448,1-1,1h-1c-.552,0-1-.448-1-1v-6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 9.25L16.25 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 9.25L13.75 2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 5.25L14.75 3.5 14.25 1.75 13.25 1.75 12.75 3.5 13.75 5.25z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default wrenchScrewdriver;
