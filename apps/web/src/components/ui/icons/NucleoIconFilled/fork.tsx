import type { iconProps } from './iconProps';

function fork(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px fork';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,16.5c-.414,0-.75-.336-.75-.75v-7c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v7c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,6.5c-.414,0-.75-.336-.75-.75V2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,9.5c-.932,0-1.801-.37-2.447-1.042-.646-.671-.982-1.554-.946-2.485l.145-3.752c.016-.415,.323-.756,.778-.721,.413,.016,.736,.364,.72,.778l-.145,3.752c-.02,.52,.168,1.013,.529,1.388,.721,.75,2.012,.75,2.732,0,.361-.375,.549-.868,.529-1.388l-.145-3.752c-.017-.414,.307-.762,.72-.778,.467-.016,.763,.307,.778,.721l.145,3.752c.036,.931-.3,1.814-.946,2.485-.646,.672-1.516,1.042-2.447,1.042Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default fork;
