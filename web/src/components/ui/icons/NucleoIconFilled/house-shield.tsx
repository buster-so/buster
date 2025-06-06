import type { iconProps } from './iconProps';

function houseShield(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house shield';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.5,14.94v-2.94c0-.88,.518-1.684,1.319-2.048l2.75-1.25c.293-.134,.607-.202,.931-.202s.638,.068,.932,.202l.568,.258v-1.964c0-.543-.258-1.064-.691-1.394L10.059,1.613c-.624-.475-1.495-.474-2.118,0L2.691,5.603s0,0,0,0c-.433,.329-.691,.85-.691,1.393v7.254c0,1.517,1.233,2.75,2.75,2.75h5.396c-.388-.566-.646-1.245-.646-2.06Z"
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

export default houseShield;
