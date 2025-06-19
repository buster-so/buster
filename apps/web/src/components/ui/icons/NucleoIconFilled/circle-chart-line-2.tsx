import type { iconProps } from './iconProps';

function circleChartLine2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle chart line 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.033,6.739c.488-.486,1.28-.486,1.767,0l3.283,3.284,4.906-4.905c-1.368-2.453-3.987-4.118-6.989-4.118C4.589,1,1,4.589,1,9c0,.836,.13,1.642,.369,2.4L6.033,6.739Z"
          fill="currentColor"
        />
        <path
          d="M11.967,11.26c-.489,.487-1.281,.486-1.767,0l-3.283-3.284L2.01,12.881c1.368,2.454,3.987,4.119,6.99,4.119,4.411,0,8-3.589,8-8,0-.837-.13-1.643-.37-2.402l-4.663,4.662Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleChartLine2;
