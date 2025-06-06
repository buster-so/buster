import type { iconProps } from './iconProps';

function filter2Plus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px filter 2 plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,12.75c0-1.155,.878-2.099,2-2.225v-.957l4.377-3.695c.396-.333,.623-.821,.623-1.339v-1.785c0-.414-.336-.75-.75-.75H2.75c-.414,0-.75,.336-.75,.75v1.785c0,.518,.227,1.005,.622,1.338l4.378,3.695v6.682c0,.414,.336,.75,.75,.75h2.5c.414,0,.75-.336,.75-.75v-1.275c-1.122-.126-2-1.07-2-2.225Z"
          fill="currentColor"
        />
        <path
          d="M16.25,12h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default filter2Plus;
