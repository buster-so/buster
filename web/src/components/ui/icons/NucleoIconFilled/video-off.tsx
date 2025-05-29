import type { iconProps } from './iconProps';

function videoOff(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px video off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.182,15h3.568c1.517,0,2.75-1.233,2.75-2.75v-3.568l-6.318,6.318Z"
          fill="currentColor"
        />
        <path
          d="M3.089,14.911L12.477,5.523c-.118-1.409-1.288-2.523-2.727-2.523H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.288,.893,2.363,2.089,2.661Zm1.911-8.911c.552,0,1,.448,1,1s-.448,1-1,1-1-.448-1-1,.448-1,1-1Z"
          fill="currentColor"
        />
        <path
          d="M17.386,5.019c-.368-.217-.805-.227-1.183-.04l-2.203,2.203v4.637l2.147,1.181c.19,.105,.397,.157,.604,.157,.219,0,.438-.059,.635-.175,.385-.228,.614-.63,.614-1.077V6.096c0-.447-.229-.849-.614-1.077Z"
          fill="currentColor"
        />
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default videoOff;
