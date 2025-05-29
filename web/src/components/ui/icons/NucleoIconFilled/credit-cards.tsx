import type { iconProps } from './iconProps';

function creditCards(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px credit cards';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.5,8.25c0-2.068,1.682-3.75,3.75-3.75h7.25v-.25c0-1.241-1.009-2.25-2.25-2.25H2.75C1.509,2,.5,3.009,.5,4.25v5.5c0,1.155,.878,2.099,2,2.225v-3.725Z"
          fill="currentColor"
        />
        <path
          d="M14.75,6H6.25c-1.241,0-2.25,1.009-2.25,2.25v5.5c0,1.241,1.009,2.25,2.25,2.25H14.75c1.241,0,2.25-1.009,2.25-2.25v-5.5c0-1.241-1.009-2.25-2.25-2.25Zm-8.5,1.5H14.75c.414,0,.75,.336,.75,.75v1.25H5.5v-1.25c0-.414,.336-.75,.75-.75Zm8.5,7H6.25c-.414,0-.75-.336-.75-.75v-2.75H15.5v2.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default creditCards;
