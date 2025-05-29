import type { iconProps } from './iconProps';

function objReduceSizeX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px obj reduce size x';

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
          d="M17.575,10.94c.258-.11,.425-.355,.425-.624v-2.632c0-.269-.167-.514-.425-.624-.258-.11-.562-.066-.774,.113l-1.559,1.316c-.154,.13-.243,.316-.243,.512s.089,.382,.242,.511l1.559,1.316h0c.211,.179,.515,.223,.774,.113Z"
          fill="currentColor"
        />
        <path
          d="M.425,10.94C.167,10.83,0,10.585,0,10.316v-2.632c0-.269,.167-.514,.425-.624,.258-.11,.562-.066,.774,.113l1.559,1.316c.154,.13,.243,.316,.243,.512,0,.195-.089,.382-.242,.511l-1.559,1.316h0c-.211,.179-.515,.223-.774,.113Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default objReduceSizeX;
