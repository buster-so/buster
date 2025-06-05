import type { iconProps } from './iconProps';

function textHighlight2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text highlight 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.759,15.077l-2.586-2.586c-.081-.081-.142-.174-.214-.26l-1.862,1.862c-.32,.321-.415,.799-.241,1.218s.579,.689,1.032,.689h3.112c.199,0,.39-.079,.53-.22l.489-.489c-.086-.072-.18-.134-.261-.214Z"
          fill="currentColor"
        />
        <path
          d="M15.615,3.695l-4.644,4.644c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22c-.293-.293-.293-.768,0-1.061L14.555,2.635l-.763-.763c-.85-.85-2.332-.852-3.183,0l-6.376,6.376c-.425,.425-.659,.99-.659,1.591s.234,1.166,.659,1.591l2.587,2.587c.425,.425,.99,.659,1.591,.659s1.166-.234,1.591-.659l6.377-6.376c.425-.425,.659-.99,.659-1.591s-.234-1.167-.659-1.591l-.763-.763Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default textHighlight2;
