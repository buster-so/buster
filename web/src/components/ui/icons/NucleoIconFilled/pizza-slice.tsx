import type { iconProps } from './iconProps';

function pizzaSlice(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pizza slice';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7,9c-.7,0-1.313,.361-1.671,.905l1.781,3.084c1.052-.058,1.89-.922,1.89-1.989,0-1.104-.895-2-2-2Z"
          fill="currentColor"
        />
        <path
          d="M15.497,3.71C11.552,1.427,6.451,1.426,2.502,3.71c-.954,.553-1.281,1.779-.729,2.733,.268,.462,.7,.793,1.217,.93,.004,0,.008,0,.012,.001l4.479,7.759c.317,.548,.883,.875,1.516,.875h.003c.633,0,1.2-.33,1.515-.879l4.462-7.773c.513-.13,.978-.446,1.249-.914,.552-.954,.225-2.18-.729-2.733Zm-6.283,10.673c-.062,.109-.163,.125-.216,.125h0c-.054,0-.154-.017-.217-.125L4.593,7.13c2.683-1.511,6.105-1.514,8.792-.011l-4.17,7.264Z"
          fill="currentColor"
        />
        <circle cx="10" cy="8" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default pizzaSlice;
