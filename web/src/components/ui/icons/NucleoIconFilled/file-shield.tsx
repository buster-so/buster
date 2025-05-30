import type { iconProps } from './iconProps';

function fileShield(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px file shield';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.5,14.94v-2.94c0-.569,.233-1.093,.603-1.5H5.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h4.5c.414,0,.75,.336,.75,.75,0,.047-.018,.087-.027,.131l2.595-1.18c.293-.134,.607-.202,.931-.202s.638,.068,.932,.202l.568,.258v-2.296c0-.467-.182-.907-.513-1.237l-3.914-3.914c-.331-.331-.77-.513-1.237-.513H4.75c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75h5.396c-.388-.566-.646-1.245-.646-2.06Zm1-12.361c.009-.004,.004-.001,.013-.005l3.922,3.921s-.001,.003-.002,.005h-2.932c-.55,0-1-.45-1-1V2.579Zm-4.75,3.421h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75Z"
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

export default fileShield;
