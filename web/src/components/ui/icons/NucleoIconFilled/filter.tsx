import type { iconProps } from './iconProps';

function filter(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px filter';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,2H2.75c-.285,0-.545,.161-.671,.416-.127,.255-.098,.56,.074,.787l4.848,6.399v6.648c0,.265,.14,.511,.368,.646,.118,.07,.25,.104,.382,.104,.125,0,.249-.031,.361-.093l2.5-1.375c.24-.132,.389-.384,.389-.657v-5.273L15.848,3.203c.172-.227,.201-.532,.074-.787-.126-.255-.387-.416-.671-.416Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default filter;
