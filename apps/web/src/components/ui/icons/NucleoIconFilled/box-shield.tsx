import type { iconProps } from './iconProps';

function boxShield(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px box shield';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.25,1.5h-2.009c-1.052,0-1.996,.586-2.464,1.529l-.348,.703c.418-.138,.857-.231,1.321-.231h3.5V1.5Z"
          fill="currentColor"
        />
        <path
          d="M14.223,3.028c-.468-.942-1.412-1.528-2.464-1.528h-2.009V3.5h3.5c.464,0,.903,.093,1.322,.231l-.348-.703Z"
          fill="currentColor"
        />
        <path
          d="M9.5,14.94v-2.94c0-.88,.518-1.684,1.319-2.048l2.75-1.25c.293-.134,.607-.202,.931-.202s.638,.068,.932,.202l.568,.258v-1.21c0-1.517-1.233-2.75-2.75-2.75h-3.5v2.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.75h-3.5c-1.517,0-2.75,1.233-2.75,2.75v5.5c0,1.517,1.233,2.75,2.75,2.75h4.906c-.099-.325-.156-.678-.156-1.06Z"
          fill="currentColor"
        />
        <path
          d="M17.561,11.317l-2.75-1.25c-.197-.09-.424-.09-.621,0l-2.75,1.25c-.268,.122-.439,.389-.439,.683v2.94c0,2.05,2.96,2.938,3.298,3.032,.066,.019,.134,.028,.202,.028s.136-.009,.202-.028c.337-.094,3.298-.982,3.298-3.032v-2.94c0-.294-.172-.561-.439-.683Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default boxShield;
