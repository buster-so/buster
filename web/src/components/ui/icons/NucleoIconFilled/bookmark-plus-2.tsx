import type { iconProps } from './iconProps';

function bookmarkPlus2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bookmark plus 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,13c-1.241,0-2.25-1.009-2.25-2.25v-.25h-.25c-1.241,0-2.25-1.009-2.25-2.25s1.009-2.25,2.25-2.25h.25v-.25c0-1.241,1.009-2.25,2.25-2.25,.26,0,.506,.053,.738,.135-.062-1.462-1.261-2.635-2.738-2.635H5.75c-1.517,0-2.75,1.233-2.75,2.75v12.5c0,.276,.152,.531,.396,.661,.244,.131,.54,.117,.77-.037l4.834-3.223,4.834,3.223c.125,.083,.271,.126,.416,.126,.122,0,.243-.029,.354-.089,.244-.13,.396-.385,.396-.661v-3.388c-.236,.084-.486,.138-.75,.138Z"
          fill="currentColor"
        />
        <path
          d="M16.75,7.5h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bookmarkPlus2;
