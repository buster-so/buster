import type { iconProps } from './iconProps';

function nodes2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px nodes 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.125,4.812L9.375,1.487c-.23-.134-.52-.134-.75,0L2.875,4.812c-.232,.134-.375,.382-.375,.649v7.078c0,.268,.143,.515,.375,.649l5.75,3.325c.115,.067,.245,.101,.375,.101s.26-.034,.375-.101l5.75-3.325c.232-.134,.375-.382,.375-.649V5.461c0-.268-.143-.515-.375-.649Zm-5.375-1.375l3.536,2.045-3.536,2.177V3.436Zm-2.181,5.564l-3.569,2.197V6.803l3.569,2.197Zm-2.855-3.519l3.536-2.045V7.657l-3.536-2.177Zm3.536,4.862v4.221l-3.536-2.045,3.536-2.177Zm1.5,0l3.536,2.177-3.536,2.045v-4.221Zm.681-1.343l3.569-2.197v4.393l-3.569-2.197Z"
          fill="currentColor"
        />
        <circle cx="9" cy="9" fill="currentColor" r="2" />
        <circle cx="3.25" cy="5.5" fill="currentColor" r="2" />
        <circle cx="3.25" cy="12.5" fill="currentColor" r="2" />
        <circle cx="14.75" cy="5.5" fill="currentColor" r="2" />
        <circle cx="14.75" cy="12.5" fill="currentColor" r="2" />
        <circle cx="9" cy="2.25" fill="currentColor" r="2" />
        <circle cx="9" cy="15.75" fill="currentColor" r="2" />
      </g>
    </svg>
  );
}

export default nodes2;
