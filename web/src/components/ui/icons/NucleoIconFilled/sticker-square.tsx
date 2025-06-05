import type { iconProps } from './iconProps';

function stickerSquare(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px sticker square';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.75.5H3.25C1.733.5.5,1.733.5,3.25v5.5c0,1.517,1.233,2.75,2.75,2.75h2.093c1.27,0,2.462-.494,3.359-1.391l1.406-1.407c.885-.884,1.392-2.108,1.392-3.358v-2.093c0-1.517-1.233-2.75-2.75-2.75Zm-1.108,8.548c-.486.485-1.099.79-1.764.899.073-.221.122-.453.122-.698v-2c0-.689.561-1.25,1.25-1.25h2c.245,0,.476-.049.696-.122-.112.661-.421,1.285-.898,1.763l-1.406,1.407Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default stickerSquare;
