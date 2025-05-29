import type { iconProps } from './iconProps';

function contacts(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px contacts';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,2H6.25c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h5.5c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-2.75,4c.701,0,1.269,.568,1.269,1.269s-.568,1.269-1.269,1.269-1.269-.568-1.269-1.269,.568-1.269,1.269-1.269Zm2.198,5.661c-.565,.178-1.314,.339-2.198,.339s-1.633-.161-2.198-.339c-.397-.125-.606-.563-.437-.944,.448-1.011,1.458-1.717,2.635-1.717s2.187,.706,2.635,1.717c.168,.38-.04,.819-.437,.944Z"
          fill="currentColor"
        />
        <path
          d="M16.25,14.5c-.414,0-.75-.336-.75-.75V4.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V13.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M1.75,14.5c-.414,0-.75-.336-.75-.75V4.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V13.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default contacts;
