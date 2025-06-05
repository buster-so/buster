import type { iconProps } from './iconProps';

function investment3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px investment 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,12h-1.25c-1.26,0-2.399,.501-3.25,1.304v-2.554c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v6c0,.414,.336,.75,.75,.75h1.25c2.619,0,4.75-2.131,4.75-4.75,0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,1H3.75c-1.243,0-2.25,1.007-2.25,2.25v5.5c0,1.243,1.007,2.25,2.25,2.25H14.25c1.243,0,2.25-1.007,2.25-2.25V3.25c0-1.243-1.007-2.25-2.25-2.25Zm-1.654,8.5H5.404c-.283-1.188-1.216-2.121-2.404-2.404v-2.192c1.188-.283,2.121-1.216,2.404-2.404h7.192c.283,1.188,1.216,2.121,2.404,2.404v2.192c-1.188,.283-2.121,1.216-2.404,2.404Z"
          fill="currentColor"
        />
        <circle cx="9" cy="6" fill="currentColor" r="2" />
      </g>
    </svg>
  );
}

export default investment3;
