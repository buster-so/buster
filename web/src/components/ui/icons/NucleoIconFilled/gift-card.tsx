import type { iconProps } from './iconProps';

function giftCard(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gift card';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10,.5c-1.344,0-2.212,.752-2.75,1.676-.538-.924-1.406-1.676-2.75-1.676-1.378,0-2.5,1.122-2.5,2.5s1.122,2.5,2.5,2.5h2v-.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v.75h2c1.378,0,2.5-1.122,2.5-2.5s-1.122-2.5-2.5-2.5Zm-5.5,3.5c-.551,0-1-.449-1-1s.449-1,1-1c1.193,0,1.681,1.173,1.875,2h-1.875Zm5.5,0h-1.875c.195-.827,.682-2,1.875-2,.551,0,1,.449,1,1s-.449,1-1,1Z"
          fill="currentColor"
        />
        <path
          d="M8,4.75v2.75h9v-.75c0-1.517-1.233-2.75-2.75-2.75H7.25c.414,0,.75,.336,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M6.5,7.5v-2.75c0-.414,.336-.75,.75-.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v.75H6.5Z"
          fill="currentColor"
        />
        <path d="M6.5,9H1v3.25c0,1.517,1.233,2.75,2.75,2.75h2.75v-6Z" fill="currentColor" />
        <path d="M8,9v6h6.25c1.517,0,2.75-1.233,2.75-2.75v-3.25H8Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default giftCard;
