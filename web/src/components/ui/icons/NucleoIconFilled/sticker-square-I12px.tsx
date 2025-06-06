import type { iconProps } from './iconProps';

function stickerSquare(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sticker square';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h2.765c1.803,0,3.498-.702,4.773-1.977l1.735-1.735c1.275-1.275,1.977-2.97,1.977-4.773v-2.765c0-1.517-1.233-2.75-2.75-2.75Zm-.288,9.227l-1.735,1.735c-.647,.647-1.44,1.081-2.298,1.321,.042-.172,.071-.349,.071-.533v-3.25c0-.828,.672-1.5,1.5-1.5h3.25c.185,0,.362-.029,.533-.071-.24,.857-.674,1.651-1.321,2.298Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default stickerSquare;
