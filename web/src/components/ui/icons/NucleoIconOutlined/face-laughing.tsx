import type { iconProps } from './iconProps';

function faceLaughing(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face laughing';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.897,10.757c-.154-.154-.366-.221-.583-.189h0c-1.532,.239-3.112,.238-4.638-.001-.214-.032-.421,.035-.572,.185-.154,.153-.227,.376-.193,.598,.23,1.511,1.558,2.651,3.089,2.651s2.86-1.141,3.089-2.654c.033-.216-.039-.436-.192-.589Z"
          fill="currentColor"
        />
        <path
          d="M14.692,13.49c-1.328,1.681-3.384,2.76-5.692,2.76-2.308,0-4.365-1.079-5.692-2.76"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16,7.107c-.832-3.086-3.651-5.357-7-5.357C5.651,1.75,2.832,4.021,2,7.107"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5,8.25c0-.69,.56-1.25,1.25-1.25s1.25,.56,1.25,1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.5,8.25c0-.69,.56-1.25,1.25-1.25s1.25,.56,1.25,1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M.478,11.917c.611,.57,1.57,.535,2.141-.077,.52-.558,.606-1.62,.604-2.275,0-.319-.27-.57-.588-.549-.654,.043-1.708,.202-2.228,.76-.572,.613-.54,1.572,.071,2.142Z"
          fill="currentColor"
        />
        <path
          d="M17.522,11.917c-.611,.57-1.57,.535-2.141-.077-.52-.558-.606-1.62-.604-2.275,0-.319,.27-.57,.588-.549,.654,.043,1.708,.202,2.228,.76,.572,.613,.54,1.572-.071,2.142Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default faceLaughing;
