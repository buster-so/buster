import type { iconProps } from './iconProps';

function cards(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cards';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="1em" width="10" fill="currentColor" rx="1.75" ry="1.75" x="1" y="1" />
        <path
          d="M16.54,5.944c-.235-.404-.614-.692-1.066-.812l-2.283-.6c-.402-.105-.811,.134-.916,.535-.105,.4,.134,.811,.535,.916l2.283,.599c.133,.035,.213,.172,.178,.306l-2.292,8.704c-.036,.133-.171,.213-.306,.178l-6.491-1.709c-.401-.107-.811,.133-.916,.534-.105,.4,.133,.811,.534,.916l6.491,1.709c.149,.04,.298,.058,.445,.058,.775,0,1.486-.52,1.692-1.304l2.292-8.704c.119-.452,.055-.923-.18-1.327Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cards;
