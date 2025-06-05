import type { iconProps } from './iconProps';

function ranking(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ranking';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.75,9.5h-2.75v-.75c0-.965-.785-1.75-1.75-1.75h-2.5c-.965,0-1.75,.785-1.75,1.75v2.25H3.25c-.965,0-1.75,.785-1.75,1.75v1.5c0,.965,.785,1.75,1.75,1.75H14.75c.965,0,1.75-.785,1.75-1.75v-3c0-.965-.785-1.75-1.75-1.75ZM3,14.25v-1.5c0-.138,.112-.25,.25-.25h2.75v2H3.25c-.138,0-.25-.112-.25-.25Zm12,0c0,.138-.112,.25-.25,.25h-2.75v-3.5h2.75c.138,0,.25,.112,.25,.25v3Z"
          fill="currentColor"
        />
        <path
          d="M7.96,2.479c.196-.038,.376-.093,.54-.16v2.431c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V.75c0-.337-.228-.628-.552-.718-.32-.087-.671,.051-.846,.34-.013,.021-.319,.518-.924,.634-.407,.078-.674,.471-.596,.878,.077,.406,.475,.671,.877,.596Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default ranking;
