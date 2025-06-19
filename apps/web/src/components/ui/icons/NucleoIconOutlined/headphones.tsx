import type { iconProps } from './iconProps';

function headphones(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px headphones';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13,14.25h1.137c.941,0,1.755-.656,1.955-1.576l.335-1.545c.193-.89-.24-1.799-1.053-2.209l-1.123-.567"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5,14.25h-1.137c-.941,0-1.755-.656-1.955-1.576l-.335-1.545c-.193-.89,.24-1.799,1.053-2.209l1.123-.567"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13,14.25l1.084-5c.099-.403,.166-.817,.166-1.25,0-2.899-2.351-5.25-5.25-5.25S3.75,5.101,3.75,8c0,.433,.067,.847,.166,1.25l1.084,5"
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

export default headphones;
