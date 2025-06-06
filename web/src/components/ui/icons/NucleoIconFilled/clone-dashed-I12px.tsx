import type { iconProps } from './iconProps';

function cloneDashed(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clone dashed';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="12.5" width="12.5" fill="currentColor" rx="2.75" ry="2.75" x="1" y="1" />
        <path
          d="M7.25,17c-1.126,0-2.127-.674-2.55-1.718-.155-.384,.03-.821,.414-.977,.385-.155,.822,.03,.977,.414,.192,.475,.647,.782,1.159,.782,.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11.75,17h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,17c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75c.689,0,1.25-.561,1.25-1.25,0-.414,.336-.75,.75-.75s.75,.336,.75,.75c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,12.5c-.414,0-.75-.336-.75-.75v-2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,8c-.414,0-.75-.336-.75-.75,0-.512-.307-.967-.782-1.159-.384-.156-.569-.593-.414-.977,.156-.384,.594-.567,.977-.414,1.044,.423,1.718,1.424,1.718,2.55,0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cloneDashed;
