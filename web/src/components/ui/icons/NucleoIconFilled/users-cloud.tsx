import type { iconProps } from './iconProps';

function usersCloud(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users cloud';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12,1.75c-.5,0-.965,.135-1.38,.352,.547,.745,.88,1.655,.88,2.648s-.333,1.903-.88,2.648c.415,.217,.88,.352,1.38,.352,1.654,0,3-1.346,3-3s-1.346-3-3-3Z"
          fill="currentColor"
        />
        <path
          d="M8.5,13.875c0-1.644,1.168-3.063,2.701-3.487-1.129-1.033-2.608-1.638-4.201-1.638-2.369,0-4.505,1.315-5.575,3.432-.282,.557-.307,1.213-.069,1.801,.246,.607,.741,1.079,1.358,1.293,1.384,.48,2.826,.724,4.286,.724,.7,0,1.395-.059,2.081-.17-.364-.565-.581-1.234-.581-1.955Z"
          fill="currentColor"
        />
        <path
          d="M15,10c-1.186,0-2.241,.714-2.72,1.756-1.197-.089-2.28,.896-2.28,2.119,0,1.172,.953,2.125,2.125,2.125h2.875c1.654,0,3-1.346,3-3s-1.346-3-3-3Z"
          fill="currentColor"
        />
        <circle cx="7" cy="4.75" fill="currentColor" r="3" />
      </g>
    </svg>
  );
}

export default usersCloud;
