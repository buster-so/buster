import type { iconProps } from './iconProps';

function circleCaretUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle caret up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm2.022,10H6.978c-.601,0-.958-.672-.621-1.17l2.022-2.987c.297-.439,.945-.439,1.242,0l2.022,2.987c.337,.498-.02,1.17-.621,1.17Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleCaretUp;
