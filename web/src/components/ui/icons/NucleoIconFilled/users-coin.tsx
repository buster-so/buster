import type { iconProps } from './iconProps';

function usersCoin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users coin';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="5.25" cy="3.5" fill="currentColor" r="2.5" />
        <circle cx="12.75" cy="3.5" fill="currentColor" r="2.5" />
        <path
          d="M9,10c-2.068,0-3.75,1.682-3.75,3.75s1.682,3.75,3.75,3.75,3.75-1.682,3.75-3.75-1.682-3.75-3.75-3.75Zm.75,4.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5Z"
          fill="currentColor"
        />
        <path
          d="M8.712,8.529c-.32-.355-.575-.547-.834-.736-.756-.551-1.688-.793-2.628-.793-2.216,0-4.167,1.569-4.641,3.732-.188,.864,.35,1.748,1.225,2.012,.554,.167,1.125,.295,1.744,.385,.014,.001,.098,.008,.233,.016,.293-2.512,2.346-4.475,4.901-4.617Z"
          fill="currentColor"
        />
        <path
          d="M9.288,8.529c.32-.355,.575-.547,.834-.736,.756-.551,1.688-.793,2.628-.793,2.216,0,4.167,1.569,4.641,3.732,.188,.864-.35,1.748-1.225,2.012-.554,.167-1.125,.295-1.744,.385-.014,.001-.098,.008-.233,.016-.293-2.512-2.346-4.475-4.901-4.617Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default usersCoin;
