import type { iconProps } from './iconProps';

function student(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px student';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.879,3.5s-.317,2.63,.621,4.489"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.953,16c1.298-1.958,3.522-3.25,6.047-3.25s4.749,1.291,6.047,3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.201,.839l5.529,2.433c.199,.088,.199,.37,0,.458l-5.529,2.433c-.128,.056-.274,.056-.403,0L3.27,3.729c-.199-.088-.199-.37,0-.458L8.799,.839c.128-.056,.274-.056,.403,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.681,4.79c-.266,.515-.431,1.091-.431,1.71,0,2.071,1.679,3.75,3.75,3.75s3.75-1.679,3.75-3.75c0-.62-.165-1.195-.431-1.71"
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

export default student;
