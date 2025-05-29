import type { iconProps } from './iconProps';

function ballTennis(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ball tennis';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M1.027,8.507c2.002,.334,4.132-.263,5.675-1.805,1.542-1.542,2.14-3.672,1.805-5.675-1.882,.115-3.73,.881-5.165,2.316-1.434,1.434-2.201,3.283-2.316,5.164Z"
          fill="currentColor"
        />
        <path
          d="M16.973,9.492c-.357-.06-.718-.095-1.08-.095-1.664,0-3.328,.634-4.596,1.901-1.542,1.542-2.14,3.672-1.805,5.675,1.882-.115,3.73-.881,5.165-2.316s2.201-3.283,2.316-5.164Z"
          fill="currentColor"
        />
        <path
          d="M10.237,10.237c1.821-1.821,4.308-2.571,6.685-2.265-.218-1.693-.967-3.331-2.265-4.629s-2.936-2.047-4.629-2.265c.306,2.376-.444,4.863-2.265,6.685-1.56,1.56-3.608,2.339-5.656,2.339-.344,0-.687-.03-1.029-.074,.218,1.693,.967,3.331,2.265,4.629s2.936,2.047,4.629,2.265c-.305-2.376,.444-4.863,2.265-6.685Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default ballTennis;
