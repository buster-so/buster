import type { iconProps } from './iconProps';

function objIncreaseSizeX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px obj increase size x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="12.5"
          width="8.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="4.75"
          y="2.75"
        />
        <path
          d="M15.425,7.06c-.258,.11-.425,.355-.425,.624v2.632c0,.269,.167,.514,.425,.624,.258,.11,.562,.066,.774-.113l1.559-1.316c.154-.13,.243-.316,.243-.512s-.089-.382-.242-.511l-1.559-1.316h0c-.211-.179-.515-.223-.774-.113Z"
          fill="currentColor"
        />
        <path
          d="M2.575,7.06c.258,.11,.425,.355,.425,.624v2.632c0,.269-.167,.514-.425,.624-.258,.11-.562,.066-.774-.113L.243,9.512C.089,9.382,0,9.195,0,9s.089-.382,.242-.511l1.559-1.316h0c.211-.179,.515-.223,.774-.113Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default objIncreaseSizeX;
