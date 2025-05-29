import type { iconProps } from './iconProps';

function shoeSneakers(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shoe sneakers';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.196,9.553c.603,.134,1.137,.476,1.525,.947h12.201c-.16-.72-.583-1.358-1.2-1.762l-4.673-3.323-1.179,1.887c-.143,.228-.387,.353-.637,.353-.136,0-.273-.037-.397-.114-.351-.22-.458-.683-.239-1.034l1.227-1.963-2.346-1.668c-.337-.24-.806-.161-1.046,.177-.24,.337-.161,.806,.177,1.046l.343,.244c-.479,.733-1.289,1.157-2.26,1.157-1.142,0-2.147-.694-2.56-1.769-.111-.29-.39-.481-.7-.481h-.184c-.965,0-1.75,.785-1.75,1.75v3.729l3.696,.825Z"
          fill="currentColor"
        />
        <path
          d="M4.733,11.711c-.162-.349-.484-.61-.862-.693l-3.371-.752v.985c0,1.516,1.233,2.75,2.75,2.75h2.528l-1.045-2.289Z"
          fill="currentColor"
        />
        <path d="M6.514,12l.913,2h7.698c1.278,0,2.352-.844,2.724-2H6.514Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default shoeSneakers;
